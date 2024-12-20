import ccxt from 'ccxt';

(async () => {
    const exchangeId = 'binance'; // Replace with your desired exchange
    const symbol = 'BTC/USDT'; // Replace with your desired trading pair
    const timeframe = '5m'; // Replace with your desired timeframe
    const fromTimestamp = ccxt.parse8601('2022-07-21 00:00:00'); // Start time in ISO 8601 format

    const exchange = new ccxt.binance({
        enableRateLimit: true, // Ensures adherence to rate limits
    });

    let ohlcvList = [];
    let fromTs = fromTimestamp;

    try {
        while (true) {
			
            console.log(`Fetching OHLCV data starting from ${new Date(fromTs).toISOString()}...`);
            const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, fromTs, 1000);
			console.log(ohlcv)
			console.log('length: %d', ohlcvList.length)
            if (ohlcv.length === 0) {
                console.log('No more data to fetch.');
                break;
            }
			
            ohlcvList = ohlcvList.concat(ohlcv);
            fromTs = ohlcv[ohlcv.length - 1][0]; // Update timestamp to the last entry's time

            // Stop if the fetched data is less than the limit
            if (ohlcv.length < 1000) {
                break;
            }
        }

        console.log(`Fetched ${ohlcvList.length} OHLCV entries.`);
    } catch (error) {
        console.error('Error fetching OHLCV data:', error);
    }
})();
