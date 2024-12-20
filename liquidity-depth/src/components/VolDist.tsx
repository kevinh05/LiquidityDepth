import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// interface DataEntry {
// 	close_price: string;
// 	exchange: string;
// 	high_price: string;
// 	id: number;
// 	liquidity: string | null;
// 	low_price: string;
// 	open_price: string;
// 	recorded_at: string;
// 	row_num: number;
// 	symbol: string;
// 	timestamp: string;
// 	total_rows: number;
// 	volume: string;
//   }




interface VolDistProps {
  data: any[];
  colors: { [key: string]: string };
}

export function VolDist({ data, colors }: VolDistProps) {
  // Step 1: Create a map to track the most recent entry for each exchange
  const mostRecentVolumes: Map<string, {volume: number, timestamp: string}> =  new Map<string, {volume: number, timestamp: string}>();
  data.forEach((entry) => {
	const currentTimestamp = new Date(entry.timestamp).getTime();
	const existingEntry = mostRecentVolumes.get(entry.exchange);
    if (
      !existingEntry || 
      (currentTimestamp > new Date(existingEntry.timestamp).getTime() && entry.volume != 0)
    ) {
		mostRecentVolumes.set(entry.exchange, {volume: Number(entry.volume), timestamp: entry.timestamp});
    }
  });
  const chartData: { name: string; value: number; timestamp: string }[] = []; 
  for (const [key, value] of mostRecentVolumes) {
	chartData.push({name: key, value: value.volume, timestamp: value.timestamp});
  }

  // Step 2: Render the PieChart
  return (
    <div className="bg-gray-800 shadow-md rounded-md p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Volume Distribution</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              fill="#8884d8"
              label={{
                fill: '#ffffff',
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.name] || '#cccccc'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderRadius: '10px', 
                color: '#ffffff', 
                border: '1px solid #374151' 
              }}
              labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
			  formatter={(value: number, name: string, props: any) => {
				const entry = props.payload;
				return [
				  <div className='text-white'>
					<div className='font-bold'>{name}</div>
					<div>Volume: {value}</div>
					<div>Time: {entry.timestamp}</div>
				  </div>
				];
			  }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ color: '#ffffff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

