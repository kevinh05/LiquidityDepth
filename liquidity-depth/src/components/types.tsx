export interface inputOHLCVData {
    exchange: string;
    timestamp: string;
    high_price: string;
    low_price: string;
    open_price: string;
    close_price: string;
	volume: string;
    error?: string;
}

export interface OHLCVData {
    exchange: string;
    timestamp: string;
    high_price: number;
    low_price: number;
    open_price: number;
    close_price: number;
	volume: number;
    error?: string;
}

export interface colors {
    [key: string]: string;
}

export interface inputTokenData {
    address: string;
    market_cap: string;
    name: string;
    network_id: number;
    network_name: string;
    price: string;
    symbol: string;
    timestamp: string;
}

export interface tokenData {
    address: string;
    market_cap: number;
    name: string;
    network_id: number;
    network_name: string;
    price: number;
    symbol: string;
    timestamp: string;
}

