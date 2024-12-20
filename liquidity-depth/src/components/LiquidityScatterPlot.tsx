import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OHLCVData } from './types';

interface ScatterPlotProps {
  data: OHLCVData[];
  colors: { [key: string]: string };
}

export function LiquidityScatterPlot({ data }: ScatterPlotProps) {
  // Step 1: Process the data to calculate liquidity for each exchange
  const scatterData: { name: string; liquidity: number; highPrice: number; timestamp: string }[] = [];

  const mostRecentEntries: Map<string, OHLCVData> = new Map<string, OHLCVData>();
  data.forEach((entry) => {
    const currentTimestamp = new Date(entry.timestamp).getTime();
    const existingEntry = mostRecentEntries.get(entry.exchange);
    if (!existingEntry || currentTimestamp > new Date(existingEntry.timestamp).getTime()) {
      mostRecentEntries.set(entry.exchange, entry);
    }
  });

  for (const [exchange, entry] of mostRecentEntries) {
    const highPrice = entry.high_price || 0;
    const lowPrice = entry.low_price || 0;
    const volume = entry.volume || 0;

    const priceRange = highPrice - lowPrice;
    const liquidity = priceRange > 0 && volume > 0 ? volume / priceRange : 0;

    scatterData.push({
      name: exchange,
      liquidity,
      highPrice,
      timestamp: entry.timestamp,
    });
  }




  // Step 2: Render the ScatterChart
  return (
    <div className="bg-gray-800 shadow-md rounded-md p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Liquidity vs High Price</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              dataKey="highPrice" 
              name="High Price" 
              domain={['dataMin - 100', 'dataMax + 100']} 
              tick={{ fill: '#ffffff' }}
              label={{ value: 'High Price', position: 'insideBottomRight', offset: -5, fill: '#ffffff' }}
              tickFormatter={(tick) => tick.toExponential(2)}
            />
            <YAxis 
              type="number" 
              dataKey="liquidity" 
              name="Liquidity" 
              domain={['dataMin - 0.1', 'dataMax + 0.1']} 
              tick={{ fill: '#ffffff' }}
              // label={{ value: 'Liquidity', angle: -90, position: 'insideLeft', fill: '#ffffff' }}
              tickFormatter={(tick) => tick.toExponential(2)}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#1F2937',
                borderRadius: '10px',
                color: '#ffffff',
                border: '1px solid #374151',
              }}
              labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
              formatter={(value, name, props) => {
                const entry = props.payload;
                return [
                  <div className="text-white">
                    <div className="font-bold">{name}</div>
                    <div>{name === 'High Price' ? `High: ${value}` : `Liquidity: ${value}`}</div>
                    <div>Exchange: {entry.name}</div>
                    <div>Time: {entry.timestamp}</div>
                  </div>,
                ];
              }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Scatter 
              name="Exchanges" 
              data={scatterData} 
              fill="#8884d8"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
