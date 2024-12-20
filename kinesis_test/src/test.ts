// src/test.ts
import { KinesisPublisher } from './KinesisPublisher';
import { KinesisSubscriber } from './KinesisSubscriber';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  const config = {
    streamName: 'liquidityxyz-master',  // Replace with your stream
    region: 'us-east-2'              // Replace with your region
  };

  // Initialize publisher and subscriber
  const publisher = new KinesisPublisher(config);
  const subscriber = new KinesisSubscriber(config);

  // Message tracking for validation
  const receivedMessages: Record<string, any>[] = [];

  // Start subscriber
  subscriber.start(async (data) => {
    console.log('Received message:', data);
    receivedMessages.push(data);
  });

  // Wait for subscriber to initialize
  await sleep(2000);

  try {
    // Test 1: Direct publish
    console.log('Test 1: Direct publish');
    const message1 = { 
      id: '1',
      test: 'direct-message', 
      timestamp: new Date().toISOString() 
    };
    await publisher.publishRecord(message1);
    console.log('Direct publish succeeded');

    // Test 2: Publish with retry
    console.log('Test 2: Publish with retry');
    const message2 = { 
      id: '2',
      test: 'retry-message', 
      timestamp: new Date().toISOString() 
    };
    await publisher.publishRecordWithRetry(message2);
    console.log('Retry publish succeeded');

    // Test 3: Batch publish
    // console.log('Test 3: Batch publish');
    const messages = Array.from({ length: 5 }, (_, i) => ({
      id: `batch-${i + 1}`,
      test: `batch-message-${i + 1}`,
      timestamp: new Date().toISOString()
    }));

	const records = Array.from({length: 5}, (_, i) => ({
		data: messages[i],
		partitionKey: 'source1'
	}));

	await publisher.publishBatchToKinesis(records);
    console.log('Batch publish succeeded');

    // Wait for messages to be processed
    console.log('Waiting for messages to be processed...');
    await sleep(10000);

    // Print summary
    console.log('\nTest Summary:');
    console.log('Messages sent:', 7); // 1 direct + 1 retry + 5 batch
    console.log('Messages received:', receivedMessages.length);
    console.log('Received message IDs:', receivedMessages.map(msg => msg.id));

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    subscriber.destroy();
    publisher.destroy();
  }
}

// Run tests
console.log('Starting Kinesis integration tests...');
test().then(() => console.log('Tests completed'));