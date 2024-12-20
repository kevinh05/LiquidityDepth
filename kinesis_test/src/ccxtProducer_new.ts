import * as ccxt from 'ccxt';
import { KinesisPublisher, KinesisRecord } from './KinesisPublisher';

const exchanges: ExchangeId[] = ["coinbase", "gemini", "kraken"];
type ExchangeId = "binance" | "coinbase" | "kraken" | "gemini";
const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
const timeframe = '1m';

async function watchPairData(symbol: string, publisher: KinesisPublisher, exchangeInstances: ccxt.Exchange[]) {
    let records: KinesisRecord[] = [];
    
    while(true) {
        try {
            const startTime = Date.now();
            
            for (const exchange of exchangeInstances) {
                try {
                    const ticker = await exchange.fetchOHLCV(symbol, timeframe, undefined, 1);
                    const exchangeExtended = exchange.extend({ 'exchange': exchange.id }, ticker);
                    const key = exchange.id + symbol;
                    records.push({
                        data: exchangeExtended as Record<string, any>,
                        partitionKey: key
                    });
                } catch (exchangeError) {
                    console.error(`Error fetching ${symbol} from ${exchange.id}: ${exchangeError}`);
                    continue;
                }
            }

            if (records.length > 0) {
                try {
                    await publisher.publishBatchToKinesis(records);
                    console.log(`Published batch of ${records.length} records for ${symbol}`);
                    records = [];
                } catch (publishError) {
                    console.error(`Failed to publish ${symbol} to Kinesis: ${publishError}`);
                    if (records.length > exchanges.length * 10) {
                        records = records.slice(-exchanges.length * 3);
                    }
                }
            }

            const elapsedTime = Date.now() - startTime;
            const waitTime = Math.max(0, 60000 - elapsedTime);
            if (waitTime > 0) {
                await sleep(waitTime);
            }
        } catch (error) {
            console.error(`Main loop error for ${symbol}: ${error}`);
            await sleep(5000);
        }
    }
}

async function main() {
    const config = {
        streamName: 'liquidityxyz-master',
        region: 'us-east-2'
    };

    const publisher = new KinesisPublisher(config);
    
    const exchangeInstances = exchanges.map(id => 
        new ccxt[id]({'enableRateLimit': true })
    );

    await Promise.all(
        symbols.map(symbol => 
            watchPairData(symbol, publisher, exchangeInstances)
        )
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

