import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { OHLCVData } from './types';



interface LiquidityChartProps {
  chartData: OHLCVData[];
  selectedExchanges: string[];
  colors: { [key: string]: string };
}

const LiquidityChart: React.FC<LiquidityChartProps> = ({ chartData, selectedExchanges, colors }) => {
  
  const [refAreaLeft, setRefAreaLeft] = React.useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = React.useState<number | null>(null);
  const [xDomain, setXDomain] = React.useState<[number, number] | ['dataMin', 'dataMax']>(['dataMin', 'dataMax']);
  const [yDomain, setYDomain] = React.useState<[number, number] | ['auto', 'auto']>(['auto', 'auto']);

  console.log(typeof chartData[0].high_price);
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    const [newLeft, newRight] = [Math.min(refAreaLeft, refAreaRight), Math.max(refAreaLeft, refAreaRight)];

    setXDomain([newLeft, newRight]);
	console.log("zoomed", xDomain);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoomOut = () => {
    setXDomain(['dataMin', 'dataMax']);
    setYDomain(['auto', 'auto']);
  };

  const filterAndSortDataByExchange = (exchange: string) => {
    // First filter by exchange
    const filteredData = chartData.filter(data => data.exchange === exchange);
    
    // Convert timestamps to numbers and sort
    return filteredData
      .map(data => ({
        ...data,
        timestamp: new Date(data.timestamp).getTime(), // Convert string to numerical timestamp
        high_price: data.high_price, 
        low_price: data.low_price    
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-md p-6">
      <button
        onClick={zoomOut}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reset Zoom
      </button>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{
              top: 20,
              right: 40,
              left: 20,
              bottom: 80,
            }}
            onMouseDown={(e) => {
                if (e?.activeLabel) {
                    setRefAreaLeft(Number(e.activeLabel));
                }
            }}
            onMouseMove={(e) => {
				if (refAreaLeft) {
					setRefAreaRight(Number(e.activeLabel));
				}
				
			}}
            onMouseUp={() => {
                zoom();
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timestamp"
              type="number"
              domain={xDomain}
              scale="time"
              tick={{ fontSize: 12, fill: '#ffffff' }}
              angle={-30}
              textAnchor="end"
              tickFormatter={(tick) => {
                const date = new Date(tick);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              }}
              allowDuplicatedCategory={false}
              interval="preserveEnd"
			  minTickGap={50}
            />
            <YAxis 
              domain={yDomain}
              tick={{ fontSize: 12, fill: '#ffffff' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderRadius: '10px', color: '#ffffff', border: '1px solid #374151' }}
              labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ color: '#ffffff' }}
            />
            {refAreaLeft && refAreaRight ? (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="#2563EB"
                fillOpacity={0.3}
              />
            ) : null}
            {selectedExchanges.map((exchange) => {
              const data = filterAndSortDataByExchange(exchange);
              return data.length > 0 ? (
                <React.Fragment key={exchange}>
                  <Line
                    type="monotone"
                    dataKey="high_price"
                    data={data}
                    stroke={colors[exchange]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    name={`${exchange.charAt(0).toUpperCase() + exchange.slice(1)} High`}
                    connectNulls={false}  // Don't connect points with null values
                  />
                  <Line
                    type="monotone"
                    dataKey="low_price"
                    data={data}
                    stroke={colors[exchange]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 8 }}
                    name={`${exchange.charAt(0).toUpperCase() + exchange.slice(1)} Low`}
                    connectNulls={false}  // Don't connect points with null values
                  />
                </React.Fragment>
              ) : null;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiquidityChart;