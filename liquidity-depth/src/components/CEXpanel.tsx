import React, { useState, useEffect, useCallback } from 'react';
import Select from "react-dropdown-select";
import { Buffer } from 'buffer';
import '../index.css'
import MasterCEX from './masterCEX';
import {OHLCVData } from './types';
import { formatChartData } from './utils';
const CEXPanel: React.FC = () => {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(["coinbase"]);
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [startDateTime, setStartDateTime] = useState("2024-12-12T00:00");
  const [endDateTime, setEndDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<{ label: string, value: string }[]>([]);

  const colors = {
    binance: "#F3BA2F",
    coinbase: "#0052FF",
    kraken: "#5741D9",
    gemini: "#00DCFA",
    okx: "#FFA500"
  };

  const pairs = ['ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'DOGE/USDT', 'XRP/USDT', 'SUI/USDT', 'PEPE/USDT', 'LINK/USDT'];

  function hashStr(str: string): string {
    const base64 = Buffer.from(str).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function hashList(list: string[]): string {
    const joined = list.join(",");
    const base64 = Buffer.from(joined).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

 
  const endpoint = "http://3.20.181.88:1024/api";
  const handleSubmit = useCallback(async () => {
    try {
      setChartData([]);
      const hashex = hashList(selectedExchanges);
      const hashsym = hashStr(selectedPair);
      const hashSTime = hashStr(startDateTime);
      const hashETime = hashStr(endDateTime);
      const response = await fetch(endpoint + `/ohlcv/${hashex}/${hashsym}/${hashSTime}/${hashETime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
		console.log(data);
        const formattedData = formatChartData(data);
        setChartData(formattedData);
		console.log(formattedData);
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        setChartData([{ error: errorData.error || "Failed to fetch data" } as OHLCVData]);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting.");
    }
  }, [selectedExchanges, selectedPair, startDateTime, endDateTime]);

  useEffect(() => {
    // Fetch exchange names dynamically
    const fetchExchanges = async () => {
      try {
        const response = await fetch(endpoint + '/get_all_exchange_names', {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          const all_names = data.map((item: { exchange: string }) => item.exchange);
          const uniqueNames = Array.from(new Set(all_names));
          console.log(uniqueNames);
          const options = uniqueNames.map((name: unknown) => ({
            label: String(name).charAt(0).toUpperCase() + String(name).slice(1),
            value: String(name).toLowerCase(),
          }));
          setExchangeOptions(options);
        } else {
          console.error("Failed to fetch exchange names");
        }
      } catch (error) {
        console.error("Error fetching exchange names:", error);
      }
    };


    fetchExchanges();
    handleSubmit();
  }, [handleSubmit]);


  return (
    <main className="mt-5 min-h-screen bg-gradient-to-b from-purple-100 via-purple-50 to-white">
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="space-y-4">
          {/* First Row */}
          <div className="flex gap-4">
            {/* Trading Pair Selection */}
            <div className="w-1/4">
              <label htmlFor="pair" className="block text-purple-900 text-sm font-medium mb-1">
                Select Trading Pair
              </label>
              <select
                id="pair"
                className="w-full border border-purple-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
              >
                <option value="" disabled>Select a pair</option>
                {pairs.map((pair) => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>

            {/* Exchanges Selection */}
            <div className="flex-1 relative z-50">
              <label className="block text-purple-900 text-sm font-medium mb-1">
                Exchanges
              </label>
              <Select
                options={exchangeOptions}
                multi
                values={exchangeOptions.filter((exchange) =>
                  selectedExchanges.includes(exchange.value)
                )}
                onChange={(selected) =>
                  setSelectedExchanges(selected.map((item) => item.value))
                }
                placeholder="Select exchanges"
                className="select-container bg-white" 
                dropdownPosition="bottom"
                dropdownGap={2}
              />
            </div>
          </div>

          {/* Second Row */}
          <div className="flex gap-4">
            {/* Start Date-Time */}
            <div className="flex-1">
              <label htmlFor="start-datetime" className="block text-purple-900 text-sm font-medium mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="start-datetime"
                className="w-full border border-purple-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            {/* End Date-Time */}
            <div className="flex-1">
              <label htmlFor="end-datetime" className="block text-purple-900 text-sm font-medium mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="end-datetime"
                className="w-full border border-purple-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Section */}
      <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-md p-6 mt-6">
        {
          chartData.length === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-500">
              <div className="water-drop-loader">
                <div className="drop"></div>
                <div className="splash"></div>
              </div>
              <div className="water-drop-loader">
                <div className="drop"></div>
                <div className="splash"></div>
              </div>
              <div className="water-drop-loader">
                <div className="drop"></div>
                <div className="splash"></div>
              </div>
              <div className="fading-text">Loading ...</div>
            </div>
          ) : chartData[0]?.error ? (
            <div className="h-64 flex justify-center items-center">
              <p className="text-red-500 font-medium">{chartData[0].error}</p>
            </div>
          ) : (
            <MasterCEX chartData={chartData} selectedExchanges={selectedExchanges} colors={colors} />
          )
        }
      </div>
    </main>
  );
};

export default CEXPanel;
