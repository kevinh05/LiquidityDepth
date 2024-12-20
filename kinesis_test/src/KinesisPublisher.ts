import { 
    KinesisClient, 
    PutRecordCommand,
	PutRecordsCommand,
    PutRecordCommandInput 
  } from "@aws-sdk/client-kinesis";
import { KinesisConfig, RetryConfig } from "./types";

export interface KinesisRecord {
    data: Record<string, any>;
    partitionKey: string;
}

export class KinesisPublisher {
    private client: KinesisClient;
    private config: KinesisConfig;

    constructor(config: KinesisConfig) {
        this.config = config;
        this.client = new KinesisClient({
        region: this.config.region
        });
    }
	
    /**
     * Publishes a record directly to Kinesis. Fails fast on error.
     */
    async publishRecord(data: Record<string, any>): Promise<void> {
        const input: PutRecordCommandInput = {
            StreamName: this.config.streamName,
            Data: Buffer.from(JSON.stringify(data)),
            PartitionKey: Date.now().toString()
        };

        const command = new PutRecordCommand(input);
        await this.client.send(command);
    }

	async publishBatchToKinesis(
		records: Record<string, any>[]
	): Promise<void> {
		try {
		  const command = new PutRecordsCommand({
			StreamName: this.config.streamName,
			Records: records.map(record => ({
			  Data: Buffer.from(JSON.stringify(record.data)),
			  PartitionKey: record.partitionKey,
			})),
		  });
		  const result = await this.client.send(command);
		//   console.log('Batch published to Kinesis:', result);
		} catch (error) {
		  console.error('Error in batch publishing:', error);
		  throw error;
		}
	};


    /**
     * Publishes a record with retry logic. Uses exponential backoff.
     */
    async publishRecordWithRetry(
        data: Record<string, any>, 
        retryConfig: RetryConfig = {
        maxRetries: 3,
        initialRetryMs: 100,
        maxRetryMs: 5000
        }
    ): Promise<void> {
        const input: PutRecordCommandInput = {
        StreamName: this.config.streamName,
        Data: Buffer.from(JSON.stringify(data)),
        PartitionKey: Date.now().toString()
        };

        let retries = 0;
        let lastError: Error | undefined;

        while (retries <= retryConfig.maxRetries) {
        try {
            const command = new PutRecordCommand(input);
            await this.client.send(command);
            return;
        } catch (error) {
            lastError = error as Error;
            retries++;
            
            if (retries <= retryConfig.maxRetries) {
            const delay = Math.min(
                retryConfig.maxRetryMs,
                retryConfig.initialRetryMs * Math.pow(2, retries - 1)
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        }

        throw new Error(`Failed to publish record after ${retries} retries. Last error: ${lastError?.message}`);
    }

    /**
     * Closes the Kinesis client connection
     */
    destroy(): void {
        this.client.destroy();
    }
}
