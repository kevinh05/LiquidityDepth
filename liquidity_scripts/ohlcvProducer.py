import ccxt
import asyncio
from typing import List, Dict, Literal
from datetime import datetime
from dotenv import load_dotenv
from producer import KinesisProducer, KinesisConfig, KinesisRecord
import os

load_dotenv()

# binance rejects requests from USA IP addresses
exchanges: List[str] = ["coinbase", "gemini", "kraken", "okx"]
symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'XRP/USDT', 'SUI/USDT', 'PEPE/USDT', 'LINK/USDT']
timeframe = '1m'
partition_key = "ohlcv"


async def watch_pair_data(symbols: list[str]) -> None:
    config = KinesisConfig(
        stream_name=os.getenv('KINESIS_STREAM_NAME', 'liquidityxyz-master'),
        region=os.getenv('KINESIS_REGION', 'us-east-2')
    )
    
    publisher = KinesisProducer(config)
    
    # Initialize exchange instances
    exchange_instances = [
        getattr(ccxt, exchange_id)({'enableRateLimit': True})
        for exchange_id in exchanges
    ]
    
    records: List[KinesisRecord] = []
    
    while True:
        try:
            start_time = datetime.now().timestamp() * 1000
            
            for symbol in symbols:
                for exchange in exchange_instances:
                    try:
                        ticker = exchange.fetch_ohlcv(symbol, timeframe, None, 1)

                        if not ticker:  # Skip if no data
                            continue

                        exchange_data = {"0": ticker[0]}
                        exchange_data.update({'exchange': exchange.id, 'symbol': symbol})

                        records.append(KinesisRecord(
                            data=exchange_data,
                            partition_key=partition_key
                        ))
                    except Exception as exchange_error:
                        print(f"Error fetching from {exchange.id}: {exchange_error}")
                        continue
            
            if records:
                try:
                    await publisher.publish_batch_to_kinesis(records)
                    print(f"Published batch of {len(records)} records")
                    records = []
                except Exception as publish_error:
                    print(f"Failed to publish to Kinesis: {publish_error}")
                    if len(records) > len(exchanges) * 10:
                        records = records[-len(exchanges) * 3:]
            
            elapsed_time = datetime.now().timestamp() * 1000 - start_time
            wait_time = max(0, 60000 - elapsed_time)
            if wait_time > 0:
                await asyncio.sleep(wait_time / 1000)
                
        except Exception as error:
            print(f"Main loop error: {error}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(watch_pair_data(symbols))
    except KeyboardInterrupt:
        print("Shutting down...")
    except Exception as e:
        print(f"Fatal error: {e}")