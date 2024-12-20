import { Buffer } from 'buffer';
import { inputTokenData, inputOHLCVData } from './types';


export function hashStr(str: string): string {
	const base64 = Buffer.from(str).toString("base64");
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  export function hashList(list: string[]): string {
	const joined = list.join(",");
	const base64 = Buffer.from(joined).toString("base64");
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  export const formatTokenData = (data: inputTokenData[]) => {
    return data.map(item => ({
      address: item.address,
      market_cap: parseFloat(item.market_cap),
      name: item.name,
      symbol: item.symbol,
      timestamp: item.timestamp,
	  network_id: item.network_id,
	  network_name: item.network_name,
	  price: parseFloat(item.price),
    }));
  };

  export const formatChartData = (data: inputOHLCVData[]) => {
    return data.map((item) => ({
      id: `${item.exchange}-${item.timestamp}`,
      time: new Date(item.timestamp).toLocaleTimeString(),
      high_price: parseFloat(item.high_price),
      low_price: parseFloat(item.low_price),
      open_price: parseFloat(item.open_price),
      close_price: parseFloat(item.close_price),
      exchange: item.exchange,
      volume: parseFloat(item.volume),
      timestamp: item.timestamp
    }));
  };

