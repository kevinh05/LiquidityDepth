import React, { useState, useEffect, useCallback } from 'react';
import { hashStr } from './utils';
import { tokenData, OHLCVData } from './types';
import MasterDEX from './masterDEX';
import { formatTokenData } from './utils';

const DEXpanel: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('LINK/USDC');
  const [startDateTime, setStartDateTime] = useState("2024-12-12T00:00");
  const [endDateTime, setEndDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [selectedToken, setSelectedToken] = useState("tokenA");
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  //const [pairData, setPairData] = useState<number>(0);
  const [tokenData, setTokenData] = useState<tokenData[]>([]);
  
  const colors = {
    binance: "#F3BA2F",
    coinbase: "#0052FF",
    kraken: "#5741D9",
    gemini: "#00DCFA"
  };
 
  const pairs = [
	'LINK/USDC',
  'WETH/USDC',
	'PEPU/WETH',
  'WETH/USDT',
  'WBTC/USDT',
	'SUI/USDT',
	'XRP/USDT',
	'DOGE/USDT',
	'SOL/USDT'
  ];

  const endpoint = "http://3.20.181.88:1024/api";
 
  const handleSubmit = useCallback(async () => {
    try {
	
	  setChartData([]);
	  const tokenName = selectedToken == "tokenA" ? selectedPair.split("/")[0] : selectedPair.split("/")[1];
	  const hashsym = hashStr(selectedPair);
	  const hashToken = hashStr(tokenName);
	  const hashSTime = hashStr(startDateTime);
	  const hashETime = hashStr(endDateTime);

      const response1 = await fetch(endpoint + `/ohlcv/dex/${hashsym}/${hashSTime}/${hashETime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response1.ok) {
        const data = await response1.json();
        //const formattedData = formatChartData(data);
        setChartData(data);
        console.log(data);
      } else {
        const errorData = await response1.json();
        console.error("Submission failed:", errorData);
        setChartData([{ error: errorData.error || "Failed to fetch data" } as OHLCVData]);
      }


	  // const response2 = await fetch(endpoint + `/dynamic_pairs/${hashsym}/${hashSTime}/${hashETime}`, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

	  // if (response2.ok) {
      //   const data = await response2.json();
      //   setPairData(data);
      //   console.log(pairData);
      // } else {
      //   const errorData = await response2.json();
      //   console.error("Submission failed:", errorData);
      // }

	  const response3 = await fetch(endpoint + `/token_history/${hashToken}/${hashSTime}/${hashETime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

	  if (response3.ok) {
        const data = await response3.json();
		console.log(data);
		const formattedData = formatTokenData(data);
        setTokenData(formattedData);
      } else {
        const errorData = await response3.json();
        console.error("Submission failed:", errorData);
      }

    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting.");
    }
  }, [selectedPair, selectedToken, startDateTime, endDateTime]);

  useEffect(() => {
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

            {/* Token Toggle */}
            <div className="flex-1">
              <label className="block text-purple-900 text-sm font-medium mb-1">
                Select Token
              </label>
              <select
                className="w-full border border-purple-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="tokenA">Token A</option>
                <option value="tokenB">Token B</option>
              </select>
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
            <MasterDEX chartData={chartData} tokenData={tokenData} colors={colors} />
          )
        }
      </div>
    </main>
  );
};

export default DEXpanel;
