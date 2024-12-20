from sqlalchemy import Integer, create_engine, Column, String, Float, DateTime, UniqueConstraint, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
from typing import Dict
from dotenv import load_dotenv
import os

from consumer import KinesisConsumer, KinesisConfig

load_dotenv()


Base = declarative_base()

class OHLCVData(Base):
    __tablename__ = 'ohlcv_data'
    
    id = Column(Integer, primary_key=True)
    exchange = Column(String)
    symbol = Column(String)
    timestamp = Column(DateTime)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Float)
    liquidity = Column(Float)
    network_id = Column(Integer)
    
    __table_args__ = (
        UniqueConstraint('exchange', 'symbol', 'timestamp'),
    )

class OHLCVDataConsumer:
    def __init__(self, partition_key: str = 'ohlcv') -> None:
        self.config = KinesisConfig(
            stream_name=os.getenv('KINESIS_STREAM_NAME', 'liquidityxyz-master'),
            region=os.getenv('KINESIS_REGION', 'us-east-2')
        )
        self.partition_key = partition_key
        self.subscriber = KinesisConsumer(self.config, partition_key=self.partition_key)
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_host = os.getenv('DB_HOST')
        db_port = 5432
        db_name = os.getenv('DB_NAME')
        self.engine = create_engine(
            f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}',
            connect_args={'sslmode': 'require'}
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        
    async def process_record(self, data: Dict) -> None:
        try:
            print(f'Received data: {data}')
            if not data:
                return
            
            ohlcv_data = {
                'exchange': data['exchange'],
                'symbol': data['symbol'],
                'timestamp': datetime.fromtimestamp(data['0'][0]/1000),
                'open_price': data['0'][1],
                'high_price': data['0'][2],
                'low_price': data['0'][3],
                'close_price': data['0'][4],
                'volume': data['0'][5],
                'liquidity': data['0'][6] if len(data['0']) > 6 else None,
                "network_id": data.get("network_id")
            }
            
            await self.insert_data(ohlcv_data)
            
        except Exception as error:
            print(f'Error processing record: {error}')

    async def insert_data(self, data: Dict) -> None:
        try:
            session = self.Session()
            stmt = insert(OHLCVData).values(**data)
            stmt = stmt.on_conflict_do_update(
                constraint='ohlcv_data_exchange_symbol_timestamp_key',
                set_={
                    'open_price': stmt.excluded.open_price,
                    'high_price': stmt.excluded.high_price,
                    'low_price': stmt.excluded.low_price,
                    'close_price': stmt.excluded.close_price,
                    'volume': stmt.excluded.volume
                }
            )
            session.execute(stmt)
            session.commit()
            print(f'Inserted data for {data["exchange"]} at {data["timestamp"].isoformat()}')
            
        except Exception as error:
            print(f'Error inserting into database: {error}')
            session.rollback()
            raise
        finally:
            session.close()

    async def start(self) -> None:
        try:
            with self.Session() as session:
                session.execute(text('SELECT NOW()'))
            print('Database connected successfully')
            await self.subscriber.start(self.process_record)
        except Exception as error:
            print(f'Error starting consumer: {error}')
            raise

    async def stop(self) -> None:
        self.subscriber.stop()
        self.engine.dispose()

if __name__ == "__main__":
    import asyncio
    import signal
    
    async def main():
        consumer = OHLCVDataConsumer()
        
        def signal_handler():
            print('Shutting down gracefully...')
            asyncio.create_task(consumer.stop())
        
        signal.signal(signal.SIGINT, signal_handler)
        
        try:
            await consumer.start()
            print('Consumer started successfully')
        except Exception as error:
            print(f'Failed to start consumer: {error}')
            await consumer.stop()
            exit(1)
    
    asyncio.run(main())