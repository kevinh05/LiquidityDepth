import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

const api_key = process.env.API_KEY;

axios
  .post(
    "https://graph.codex.io/graphql",
    {
      query: `
        query {
          listPairsWithMetadataForToken (
            tokenAddress: "0x28561b8a2360f463011c16b6cc0b0cbef8dbbcad",
            networkId: 1
          ) {
            results {
              pair {
                address
                fee
                id
              }
            
            exchange {
                address
                name
              }
            
            backingToken {
                address
                name
              }
              
            volume
            liquidity
            }
          }
        }
      `
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": api_key
      }
    }
  ).then((response) => {
    const pairs = response.data.data.listPairsWithMetadataForToken.results;

    // Parse and display details
    pairs.forEach((item, index) => {
      console.log(`Pair ${index + 1}:`);
      console.log(`  Pair Address: ${item.pair.address}`);
      console.log(`  Backing Token Address: ${item.backingToken.address}`);
      console.log(`  Backing Token Name: ${item.backingToken.name}`);
      console.log(`  Exchange Address: ${item.exchange.address}`);
      console.log(`  Exchange Name: ${item.exchange.name}`);

      console.log(`  Volume: ${item.volume}`);
      console.log(`  Liquidity: ${item.liquidity}`);
      console.log('-----------------------------------');
    });
  })
  .catch((error) => {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  });