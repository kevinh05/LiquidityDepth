import axios from 'axios';
import { KinesisPublisher } from './KinesisPublisher';
import { getParameter } from './getParameters'



// Define the GraphQL endpoint
const url = "https://graph.codex.io/graphql";

// Load API key from environment variables
const apiKey : string = "b07c1fc7b44a6c8bf952b9f7fe1f548f72368cd8";
// Set up the headers
const headers = {
    "Content-Type": "application/json",
    "Authorization": apiKey as string,
};

// Helper function for error handling
const handleError = (error: any) => {
    if (axios.isAxiosError(error)) {
        console.error(`Error: ${error.response?.status} - ${error.response?.data || error.message}`);
    } else {
        console.error(`Error: ${error}`);
    }
};

// Function to execute a GraphQL query
const executeQuery = async (query: string): Promise<any> => {
    try {
        const response = await axios.post(url, { query }, { headers });
        if (response.data.errors) {
            console.error("GraphQL Errors:", response.data.errors);
            return null;
        }
        return response.data.data || {};
    } catch (error) {
        handleError(error);
        return null;
    }
};

// Step 1: Fetch all networks
export const getNetworks = async (): Promise<{ name: string; id: string }[]> => {
    const query = `
    {
        getNetworks {
            name
            id
        }
    }
    `;
    const data = await executeQuery(query);
    return data?.getNetworks || [];
};

// Step 2: Fetch top tokens for a specific network
export const getTopTokens = async (networkId: string, limit: number = 50): Promise<any[]> => {
    const query = `
    {
        listTopTokens(
            limit: ${limit},
            networkFilter: [${networkId}],
        ) {
            name
            address
            symbol
            networkId
            price
            marketCap
        }
    }
    `;
    const data = await executeQuery(query);
    return data?.listTopTokens || [];
};

// Step 3: Fetch metadata for each token
export const getPairsWithMetadata = async (tokenAddress: string, networkId: string): Promise<any[]> => {
    const query = `
    query {
        listPairsWithMetadataForToken (
            tokenAddress: "${tokenAddress}",
            networkId: ${networkId}
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
    `;
    const data = await executeQuery(query);
    return data?.listPairsWithMetadataForToken?.results || [];
};

// Main function to orchestrate the queries
const main = async (): Promise<void> => {
    // Step 1: Get all networks
    const networks = await getNetworks();
    if (!networks.length) {
        console.log("No networks found.");
        return;
    }

    for (const network of networks) {
        const { name: networkName, id: networkId } = network;
        console.log(`Fetching top tokens for network: ${networkName} (ID: ${networkId})`);

        // Step 2: Get top tokens for this network
        const topTokens = await getTopTokens(networkId);
        if (!topTokens.length) {
            console.log(`No top tokens found for network: ${networkName}`);
            continue;
        }

        for (const token of topTokens) {
            const { name: tokenName, address: tokenAddress } = token;
            console.log(`  Token: ${tokenName} (Address: ${tokenAddress})`);

            // Step 3: Get pairs metadata for this token
            const pairsMetadata = await getPairsWithMetadata(tokenAddress, networkId);
            if (!pairsMetadata.length) {
                console.log(`    No pairs metadata found for token: ${tokenName}`);
                continue;
            }

            pairsMetadata.forEach((pair, index) => {
                console.log(`    Pair ${index + 1}:`);
                console.log(`    NetworkId ${networkId}:`)
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
        }
    }
};

// Run the script
main().catch((error) => console.error(error));
