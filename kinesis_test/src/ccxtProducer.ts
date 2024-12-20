import * as ccxt from 'ccxt';
import { KinesisPublisher } from './KinesisPublisher';

const exchanges: ExchangeId[] = ["coinbase", "gemini", "kraken"];
type ExchangeId = "binance" | "coinbase" | "kraken" | "gemini";
const symbol = 'BTC/USDT';
const timeframe = '1m'
async function watchPairData(symbol: string) {
	const config = {
		streamName: 'liquidityxyz-master',  // Replace with your stream
		region: 'us-east-2'              // Replace with your region
	  };

	const publisher = new KinesisPublisher(config);

	let records = [];
	while(true) {
		const startTime = Date.now();
		for (const id of exchanges) {
			const exchange = new ccxt[id]({'enableRateLimit': true });
			const ticker = await exchange.fetchOHLCV(symbol, timeframe, undefined, 1);
			const exchangeExtended = exchange.extend({ 'exchange': id }, ticker);
			const key = id + symbol;
			//console.log(exchangeExtended);
			records.push({
				data: exchangeExtended,
				partitionKey: key
			})
		}

		if (records.length >= exchanges.length * 3) {
			await publisher.publishBatchToKinesis(records);
			console.log("Published batch");
			records = [];
		}

		const elapsedTime = Date.now() - startTime; // Calculate elapsed time
        const waitTime = Math.max(0, 60000 - elapsedTime); // Calculate remaining time to make 1 minute
		if (waitTime > 0) {
            await sleep(waitTime); // Wait for the remaining time
        }

	}
 
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


watchPairData(symbol);
