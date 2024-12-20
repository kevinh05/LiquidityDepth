import { getPairsWithMetadata } from "./codexProducer";


interface tokenExchange {
    tokenAddress: string;
    networkId: string;
}



const streamList: tokenExchange[] = [
    {
        tokenAddress: "0x90fe084f877c65e1b577c7b2ea64b8d8dd1ab278",
        networkId: "1088"
    },
    // {
    //     tokenAddress: "0x1f55a02a049033e3419a8e2975cf3f572f4e6e9a",
    //     networkId: "1088"
    // }
];



const main = async (): Promise<void> => {

     while (true) {

        for ( const pair of streamList) {
            const pairsMetadata = await getPairsWithMetadata(pair.tokenAddress, pair.networkId);
            console.log("neww", pairsMetadata.length);
            if (!pairsMetadata.length) {
                
                console.log(`    No pairs metadata found for token: ${pair.tokenAddress}`);
                continue;
            }

            pairsMetadata.forEach((pair, index) => {
                console.log(`    Pair ${index + 1}:`);
                console.log(`      Pair Address: ${pair.pair.address}`);
                console.log(`      Pair Fee: ${pair.pair.fee}`);
                console.log(`      Backing Token Address: ${pair.backingToken.address}`);
                console.log(`      Backing Token Name: ${pair.backingToken.name}`);
                console.log(`      Exchange Address: ${pair.exchange.address}`);
                console.log(`      Exchange Name: ${pair.exchange.name}`);
                console.log(`      Volume: ${pair.volume}`);
                console.log(`      Liquidity: ${pair.liquidity}`);
                console.log('-----------------------------------');
            });
            setTimeout(function(){}, 500);
        }

     }
            // Step 3: Get pairs metadata for this token
            
        
    
};

main();