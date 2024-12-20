from dataclasses import dataclass
from typing import Dict

@dataclass
class KinesisConfig:
    stream_name: str
    region: str

@dataclass
class RetryConfig:
    max_retries: int = 3
    initial_retry_ms: int = 100
    max_retry_ms: int = 5000

@dataclass
class KinesisRecord:
    data: Dict
    partition_key: str
