import asyncio
import boto3
import json
from typing import Callable, Optional
from botocore.client import BaseClient

from base import KinesisConfig

class KinesisConsumer:
    def __init__(self, config: KinesisConfig, partition_key: Optional[str] = None):
        self.config = config
        self.client: BaseClient = boto3.client('kinesis', region_name=config.region)
        self.partition_key = partition_key
        self.is_running = False

    async def start(self, handler: Callable[[dict], None]) -> None:
        self.is_running = True
        shards = await self._get_shards()
        await asyncio.gather(*[
            self._process_shard(shard_id, handler) 
            for shard_id in shards
        ])

    def stop(self) -> None:
        self.is_running = False

    def destroy(self) -> None:
        self.stop()
        self.client.close()

    async def _get_shards(self) -> list[str]:
        response = self.client.describe_stream(
            StreamName=self.config.stream_name
        )
        return [
            shard['ShardId'] 
            for shard in response['StreamDescription']['Shards']
        ]

    async def _process_shard(
        self,
        shard_id: str,
        handler: Callable[[dict], None]
    ) -> None:
        shard_iterator = await self._get_shard_iterator(shard_id)

        while self.is_running and shard_iterator:
            try:
                response = self.client.get_records(
                    ShardIterator=shard_iterator,
                    Limit=100
                )
                
                shard_iterator = response['NextShardIterator']

                for record in response['Records']:
                    # Only process records with the specified partition key
                    if (not self.partition_key or 
                            record['PartitionKey'] == self.partition_key):
                        data = json.loads(record['Data'].decode())
                        await handler(data)

                await asyncio.sleep(1)
            except Exception as error:
                print(f'Error processing shard {shard_id}: {error}')
                await asyncio.sleep(5)

    async def _get_shard_iterator(self, shard_id: str) -> Optional[str]:
        response = self.client.get_shard_iterator(
            StreamName=self.config.stream_name,
            ShardId=shard_id,
            ShardIteratorType='LATEST'
        )
        return response.get('ShardIterator')