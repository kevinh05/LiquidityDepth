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
          listTopTokens(
            limit: 50,
            networkFilter: [1],
          ) {
            name
            address
            symbol
            networkId
            price
            marketCap
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
  )
  .then((response) => {
    console.log("Top Tokens:", response.data.data.listTopTokens);
  })
  .catch((error) => {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  });
