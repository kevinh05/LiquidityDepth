import { WebSocket } from 'ws';
import { KinesisPublisher, KinesisRecord } from './KinesisPublisher';
import { getParameter } from './getParameters';
//npx tsx codexOHLCV.ts

interface pair {
	pairName: string; 
	pairAdressID: string; 
	exchangeName: string;
}
const partitionKey = "ohlcv";

async function subscribePools(subscriptions: pair[], batchSize: number) {
	const DEFINED_API_KEY =  await getParameter("/dev/liquidityDepth/codex", true);

	const stream_config = {
        streamName: 'liquidityxyz-master',
        region: 'us-east-2'
    };
	const publisher = new KinesisPublisher(stream_config);


	const webSocket = new WebSocket(
		`wss://graph.codex.io/graphql`,
	  	"graphql-transport-ws"
	);

	let records: KinesisRecord[] = [];

	webSocket.on('open', () => {
		console.log('WebSocket connection opened');
		webSocket.send(
		  JSON.stringify({
			type: 'connection_init',
			payload: {
			  Authorization: DEFINED_API_KEY,
			},
		  })
		);
	  });

	webSocket.on('message', (data) => {

		const event = JSON.parse(data.toString());
		// console.log(event);
		if (event.type === 'connection_ack') {
		  console.log('Connection acknowledged');
		  for (const sub of subscriptions) {
			webSocket.send(
				JSON.stringify({
				  id:  sub.pairName + "?/" + sub.exchangeName,
				  type: 'subscribe',
				  payload: {
					variables: { "pairId": sub.pairAdressID },
					id: sub.pairName + "?/" + sub.exchangeName,
					operationName: 'OnBarsUpdated',
					query: "subscription OnBarsUpdated($pairId: String!) { onBarsUpdated(pairId: $pairId) { pairAddress timestamp networkId aggregates {\n        r1 {\n          token {\n  buyers\n buys\n buyVolume\n  c\n  h\n l\n liquidity\n o\n v\n __typename\n        }\n        __typename\n      }\n        __typename\n}} }",
				  },
				})
			  );
		  }
		  
		} else if (event.type === 'next') {
		  console.log('Received message:', event.id.split("?/", 2));
		  const sub_id = event.id.split("?/", 2);
		  records.push({
			data: {
				'0': [  // '0' to match the format of ccxt OHLCV data
					new Date(event.payload.data.onBarsUpdated.timestamp).getTime() * 1000,
					event.payload.data.onBarsUpdated.aggregates.r1.token.o,
					event.payload.data.onBarsUpdated.aggregates.r1.token.h,
					event.payload.data.onBarsUpdated.aggregates.r1.token.l,
					event.payload.data.onBarsUpdated.aggregates.r1.token.c,
					event.payload.data.onBarsUpdated.aggregates.r1.token.v,
					event.payload.data.onBarsUpdated.aggregates.r1.token.liquidity
				],
				symbol: sub_id[0],
				exchange: sub_id[1],
				network_id: event.payload.data.onBarsUpdated.networkId
			},
			partitionKey: partitionKey  // use the same partition key for this producer, and include pairName and exchangeName in the data
		  });
		  if (records.length > batchSize) {
			try {
				publisher.publishBatchToKinesis(records);
				console.log(`Published batch of ${records.length} records`);
				records = [];
			} catch (publishError) {
				console.error(`Failed to publish to Kinesis: ${publishError}`);
				// Prevent records array from growing too large
				if (records.length > batchSize * 10) {
					records = records.slice(-batchSize * 3);
				}
			}
		 }
		} else if (event.type === 'error') {
			const errorEvent = JSON.parse(data.toString());
			console.error("Subscription error:", errorEvent.payload.errors);
		} else if (event.type === 'complete') {
			console.log("Subscription completed");
		} else {
			const unknownEvent = JSON.parse(data.toString());
			console.log("Unknown message type:", unknownEvent.type);
		}
	  });

	  webSocket.on('error', (error) => {
		console.error('WebSocket error:', error);
	  });

	  webSocket.on('close', (code, reason) => {
		console.log(`WebSocket closed: code=${code}, reason=${reason}`);
	  });
}

let subscriptions: pair[] = [
	{pairName: "WETH/USDC", pairAdressID: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640:1", exchangeName: "Uniswap V3"},
	{pairName: "LINK/USDC", pairAdressID: "0x79e4240e33c121402dfc9009de266356c91f241d:137", exchangeName: "Uniswap"},
	{pairName: "PEPU/WETH", pairAdressID: "0x3ebec0a1b4055c8d1180fce64db2a8c068170880:1", exchangeName: "Uniswap"},
	{pairName: "WETH/USDT", pairAdressID: "0xc7bBeC68d12a0d1830360F8Ec58fA599bA1b0e9b:1", exchangeName: "Uniswap V3"},
	{pairName: "WBTC/USDT", pairAdressID: "0x5969EFddE3cF5C0D9a88aE51E47d721096A97203:42161", exchangeName: "Uniswap V3"},
	{pairName: "WETH/USDC", pairAdressID: "0xC6962004f452bE9203591991D15f6b388e09E8D0:42161", exchangeName: "UniSwap V3"},
]
subscribePools(subscriptions, 1);