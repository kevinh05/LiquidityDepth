import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { OHLCVData } from './types';

interface SpreadChartProps {
  chartData: OHLCVData[];
  selectedExchanges: string[];
  colors: { [key: string]: string };
  maxPoints?: number;
}

const SpreadChart: React.FC<SpreadChartProps> = ({ chartData, selectedExchanges, colors, maxPoints = 20 }) => {
  console.log('SpreadChart Data:');

  const calculateSpreadData = () => {
    // Group data by timestamp and exchange
    const groupedByExchange: { [key: string]: { timestamp: string; spread: number }[] } = {};
    
    // First, group all data points by exchange
    chartData.forEach(data => {
      if (!groupedByExchange[data.exchange]) {
        groupedByExchange[data.exchange] = [];
      }
      groupedByExchange[data.exchange].push({
        timestamp: data.timestamp,
        spread: data.high_price - data.low_price
      });
    });

    // For each exchange, sort by timestamp and take only the last maxPoints
    const limitedData: { timestamp: string; [key: string]: number | string }[] = [];
    Object.entries(groupedByExchange).forEach(([exchange, points]) => {
      points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const limitedPoints = points.slice(-maxPoints);
      
      limitedPoints.forEach(point => {	
        const existingPoint = limitedData.find(d => d.timestamp === point.timestamp) || {
          timestamp: point.timestamp
        } as { timestamp: string; [key: string]: number | string };
        existingPoint[`${exchange}Spread`] = point.spread;
        
        if (!limitedData.includes(existingPoint)) {
          limitedData.push(existingPoint);
        }
      });
    });

    // Final sort by timestamp
    return limitedData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const spreadData = calculateSpreadData();

  return (
    <div className="bg-gray-800 shadow-md rounded-md p-6">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={spreadData}
            margin={{
              top: 20,
              right: 40,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12, fill: '#ffffff' }}
              angle={-30}
              textAnchor="end"
              tickFormatter={(tick) => {
                const date = new Date(tick);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#ffffff' }}
              label={{ 
                value: 'Spread', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#ffffff'
              }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderRadius: '10px', 
                color: '#ffffff', 
                border: '1px solid #374151' 
              }}
              labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: '#ffffff' }}
            />
            {selectedExchanges.map((exchange) => (
              <Bar
                key={exchange}
                dataKey={`${exchange}Spread`}
                fill={colors[exchange]}
                name={`${exchange.charAt(0).toUpperCase() + exchange.slice(1)} Spread`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpreadChart;