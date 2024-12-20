import { 
    KinesisClient,
    GetShardIteratorCommand,
    GetRecordsCommand,
    DescribeStreamCommand,
    ShardIteratorType
  } from "@aws-sdk/client-kinesis";
import { KinesisConfig, RecordHandler } from "./types";
  
  export class KinesisSubscriber {
    private client: KinesisClient;
    private config: KinesisConfig;
    private isRunning: boolean = false;
    
    constructor(config: KinesisConfig) {
      this.config = config;
      this.client = new KinesisClient({
        region: this.config.region
      });
    }
  
    async start(handler: RecordHandler) {
      this.isRunning = true;
      const shards = await this.getShards();
      
      // Start processing each shard
      const promises = shards.map(shardId => this.processShard(shardId, handler));
      await Promise.all(promises);
    }
  
    stop() {
      this.isRunning = false;
    }
  
    destroy() {
      this.stop();
      this.client.destroy();
    }
  
    private async getShards(): Promise<string[]> {
      const command = new DescribeStreamCommand({
        StreamName: this.config.streamName
      });
      
      const response = await this.client.send(command);
      return response.StreamDescription?.Shards?.map(shard => shard.ShardId!) || [];
    }
  
    private async processShard(shardId: string, handler: RecordHandler) {
      let shardIterator = await this.getShardIterator(shardId);
      
      while (this.isRunning && shardIterator) {
        try {
          const command = new GetRecordsCommand({
            ShardIterator: shardIterator,
            Limit: 100
          });
  
          const response = await this.client.send(command);
          shardIterator = response.NextShardIterator;
  
          if (response.Records) {
            for (const record of response.Records) {
              if (record.Data) {
                const data = JSON.parse(Buffer.from(record.Data).toString());
                await handler(data);
              }
            }
          }
  
          // Avoid throttling
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing shard ${shardId}:`, error);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  
    private async getShardIterator(shardId: string): Promise<string | undefined> {
      const command = new GetShardIteratorCommand({
        StreamName: this.config.streamName,
        ShardId: shardId,
        ShardIteratorType: ShardIteratorType.LATEST
      });
  
      const response = await this.client.send(command);
      return response.ShardIterator;
    }
  }