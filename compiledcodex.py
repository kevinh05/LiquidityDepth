import requests
import json
from dotenv import load_dotenv
import os

# Define the GraphQL endpoint
url = "https://graph.codex.io/graphql"


load_dotenv()
api_key = os.getenv("API_KEY")
if not api_key:
    print("API key is missing!")
    exit()

# Set up the headers

headers = {
    "Content-Type": "application/json",
    "Authorization": api_key
}


# Function to execute a GraphQL query
def execute_query(query):
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            print("GraphQL Errors:", data["errors"])
            return None
        return data.get("data", {})
    except requests.exceptions.RequestException as e:
        print(f"Error executing query: {e}")
        return None

# Step 1: Fetch all networks
def get_networks():
    query = """
    {
        getNetworks {
            name
            id
        }
    }
    """
    return execute_query(query).get("getNetworks", [])

# Step 2: Fetch top tokens for a specific network
def get_top_tokens(network_id, limit=50):
    query = f"""
    {{
        listTopTokens(
            limit: {limit},
            networkFilter: [{network_id}],
        ) {{
            name
            address
            symbol
            networkId
            price
            marketCap
        }}
    }}
    """
    return execute_query(query).get("listTopTokens", [])

# Step 3: Fetch metadata for each token
def get_pairs_with_metadata(token_address, network_id):
    query = f"""
    query {{
        listPairsWithMetadataForToken (
            tokenAddress: "{token_address}",
            networkId: {network_id}
        ) {{
            results {{
                pair {{
                    address
                    fee
                    id
                }}
                exchange {{
                    address
                    name
                }}
                backingToken {{
                    address
                    name
                }}
                volume
                liquidity
            }}
        }}
    }}
    """
    return execute_query(query).get("listPairsWithMetadataForToken", {}).get("results", [])
def prepare_price_inputs(top_tokens, network_id):
    return [{"address": token["address"], "networkId": network_id} for token in top_tokens]

# Step 4: Fetch real-time or historical prices for tokens
def get_token_prices(inputs):
    query = """
    query getTokenPrices($inputs: [GetPriceInput]!) {
        getTokenPrices(inputs: $inputs) {
            address
            confidence
            networkId
            poolAddress
            priceUsd
            timestamp
        }
    }
    """
    variables = {"inputs": inputs}
    try:
        response = requests.post(url, headers=headers, json={"query": query, "variables": variables})
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            print("GraphQL Errors:", data["errors"])
            return None
        return data.get("data", {}).get("getTokenPrices", [])
    except requests.exceptions.RequestException as e:
        print(f"Error executing query: {e}")
        return None

# Main function to orchestrate the queries
def main():
    # Step 1: Get all networks
    networks = get_networks()
    if not networks:
        print("No networks found.")
        return

    for network in networks:
        network_name = network["name"]
        network_id = network["id"]
        print(f"Fetching top tokens for network: {network_name} (ID: {network_id})")

        # Step 2: Get top tokens for this network
        top_tokens = get_top_tokens(network_id)
        if not top_tokens:
            print(f"No top tokens found for network: {network_name}")
            continue

        # Step 4: Fetch prices for these tokens
        price_inputs = prepare_price_inputs(top_tokens, network_id)
        token_prices = get_token_prices(price_inputs)
        if not token_prices:
            print(f"No prices found for tokens in network: {network_name}")
            continue

        # Display prices
        for price in token_prices:
            print(f"Token: {price['address']}")
            print(f"  Network ID: {price['networkId']}")
            print(f"  Pool Address: {price['poolAddress']}")
            print(f"  Price (USD): {price['priceUsd']}")
            print(f"  Confidence: {price['confidence']}")
            print(f"  Timestamp: {price['timestamp']}")
            print('-----------------------------------')

        for token in top_tokens:
            token_name = token["name"]
            token_address = token["address"]
            print(f"  Token: {token_name} (Address: {token_address})")

            # Step 3: Get pairs metadata for this token
            pairs_metadata = get_pairs_with_metadata(token_address, network_id)
            if not pairs_metadata:
                print(f"    No pairs metadata found for token: {token_name}")
                continue

            for index, pair in enumerate(pairs_metadata):
                print(f"    Pair {index + 1}:")
                print(f"      Pair Address: {pair['pair']['address']}")
                print(f"      Pair Fee: {pair['pair']['fee']}")
                print(f"      Backing Token Address: {pair['backingToken']['address']}")
                print(f"      Backing Token Name: {pair['backingToken']['name']}")
                print(f"      Exchange Address: {pair['exchange']['address']}")
                print(f"      Exchange Name: {pair['exchange']['name']}")
                print(f"      Volume: {pair['volume']}")
                print(f"      Liquidity: {pair['liquidity']}")
                print('-----------------------------------')

# Run the script
if __name__ == "__main__":
    main()
