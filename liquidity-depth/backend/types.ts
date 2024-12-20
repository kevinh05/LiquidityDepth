export interface KinesisConfig {
    streamName: string;
    region: string;
  }
  
export interface RetryConfig {
    maxRetries: number;      // Default: 3
    initialRetryMs: number;  // Default: 100
    maxRetryMs: number;      // Default: 5000
}

export interface RecordHandler {
  (data: Record<string, any>): Promise<void>;
}

