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
import { tokenData } from './types';


interface TokenInfoProps {
	data: tokenData[];
  }


export function TokenInfo( {data} : TokenInfoProps ) {

	if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
        <div className="text-purple-400 text-lg font-medium">
          No data found for this token
        </div>
      </div>
    );
  }

	let mostRecentTokenInfo: tokenData = data[0];
  data.forEach((entry: tokenData) => {
	if( new Date(entry.timestamp).getTime() > new Date(mostRecentTokenInfo.timestamp).getTime()){
		mostRecentTokenInfo = entry;
	}
  });
  console.log(mostRecentTokenInfo);
  return (
    <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <div className="flex-1 text-center px-4">
        <div className="text-purple-400 text-sm font-medium mb-1">Token</div>
        <div className="text-white text-lg font-bold">{mostRecentTokenInfo.name}</div>
      </div>
      
      <div className="flex-1 text-center px-4 border-l border-gray-700">
        <div className="text-purple-400 text-sm font-medium mb-1">Price</div>
        <div className="text-white text-lg font-bold">
          ${Number(mostRecentTokenInfo.price).toLocaleString()}
        </div>
      </div>
      
      <div className="flex-1 text-center px-4 border-l border-gray-700">
        <div className="text-purple-400 text-sm font-medium mb-1">Market Cap</div>
        <div className="text-white text-lg font-bold">
          ${Number(mostRecentTokenInfo.market_cap).toLocaleString()}
        </div>
      </div>
      
      <div className="flex-1 text-center px-4 border-l border-gray-700">
        <div className="text-purple-400 text-sm font-medium mb-1">Network</div>
        <div className="text-white text-lg font-bold">{mostRecentTokenInfo.network_name}</div>
      </div>
    </div>
  );
}

