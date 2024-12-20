import json
import time
import boto3
from botocore.client import BaseClient

from base import KinesisConfig, RetryConfig, KinesisRecord

class KinesisProducer:
    def __init__(self, config: KinesisConfig):
        self.config = config
        self.client: BaseClient = boto3.client('kinesis', region_name=config.region)

    async def publish_record(self, data: dict) -> None:
        input_data = {
            'StreamName': self.config.stream_name,
            'Data': json.dumps(data).encode(),
            'PartitionKey': str(int(time.time() * 1000))
        }
        self.client.put_record(**input_data)

    async def publish_batch_to_kinesis(self, records: list[KinesisRecord]) -> None:
        try:
            input_data = {
                'StreamName': self.config.stream_name,
                'Records': [{
                    'Data': json.dumps(record.data).encode(),
                    'PartitionKey': record.partition_key
                } for record in records]
            }
            self.client.put_records(**input_data)
        except Exception as error:
            print(f'Error in batch publishing: {error}')
            raise

    async def publish_record_with_retry(
        self,
        data: dict,
        retry_config: RetryConfig = RetryConfig()
    ) -> None:
        input_data = {
            'StreamName': self.config.stream_name,
            'Data': json.dumps(data).encode(),
            'PartitionKey': str(int(time.time() * 1000))
        }

        retries = 0
        last_error = None

        while retries <= retry_config.max_retries:
            try:
                self.client.put_record(**input_data)
                return
            except Exception as error:
                last_error = error
                retries += 1

                if retries <= retry_config.max_retries:
                    delay = min(
                        retry_config.max_retry_ms,
                        retry_config.initial_retry_ms * (2 ** (retries - 1))
                    )
                    time.sleep(delay / 1000)  # Convert ms to seconds

        raise Exception(
            f'Failed to publish record after {retries} retries. '
            f'Last error: {str(last_error)}'
        )

    def destroy(self) -> None:
        self.client.close()
