//esm
import * as ccxt from 'ccxt';
const exchanges = ["coinbase", "gemini", "kraken"];
const symbol = 'BTC/USDT';
const timeframe = '1m';
// async function watchPairData(symbol) {

// 	while(true) {
// 		const result = await Promise.all(exchanges.map(async (id) => {
// 			const exchange = new ccxt[id]({'enableRateLimit': true });
// 			const ticker = await exchange.fetchTicker(symbol);
// 			const exchangeExtended = exchange.extend({ 'exchange': id }, ticker);
// 			return exchangeExtended;
// 		  })) 
// 	console.log(result);
// 	}
 
// }


async function watchPairData(symbol) {
	const exchange = new ccxt["coinbase"]({'enableRateLimit': true });
	const ticker = await exchange.fetchOHLCV(symbol, timeframe, undefined, 1);
	//const exchangeExtended = exchange.extend({ 'exchange': id }, ticker);

	console.log(ticker);
	return ticker;
}

	
	
	
 
setInterval(watchPairData(symbol), 60 * 1000);




//watchPairData(symbol);


// import ccxt from 'ccxt';

// (async () => {
//     const exchangeId = 'binance'; // Replace with your desired exchange
//     const symbol = 'BTC/USDT'; // Replace with the trading pair you want to track

//     // Initialize the exchange
//     const exchange = new ccxt[exchangeId]();

//     try {
//         console.log(`Connecting to ${exchangeId} for ticker data...`);

//         while (true) {
//             // Fetch the ticker data using WebSocket
//             const ticker = await exchange.watchTicker(symbol);

//             console.log(`Ticker update for ${symbol}:`);
//             console.log(`Bid: ${ticker.bid}, Ask: ${ticker.ask}, Last: ${ticker.last}`);
//         }
//     } catch (error) {
//         console.error('Error occurred:', error);
//     } finally {
//         // Close the connection
//         if (exchange) {
//             await exchange.close();
//         }
//     }
// })();




