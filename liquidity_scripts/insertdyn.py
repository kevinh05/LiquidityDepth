import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from db_interface import DatabaseInterface  # Import your DatabaseInterface class


# Load environment variables
load_dotenv()

# Configuration
url = "https://graph.codex.io/graphql"
api_key = os.getenv("API_KEY")
if not api_key:
    raise EnvironmentError("API key is missing!")

# Database configuration
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")

allowed_networks = {
    "Ethereum": 1,
    "Polygon": 137,
    "Base": 8453,
    "Solana": 1399811149,
    "Binance Smart Chain": 56,
    "Arbitrum": 42161,
    "Optimism": 10
}

# Set up the headers for GraphQL requests
headers = {
    "Content-Type": "application/json",
    "Authorization": api_key
}

# Function to generate dynamic timestamps
def get_current_timestamp():
    """Generate the current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()

# Function to execute GraphQL queries
def execute_query(query):
    """
    Execute a GraphQL query against the Codex API.
    :param query: The GraphQL query string.
    :return: Parsed JSON data or None if an error occurs.
    """
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            print(f"GraphQL Errors: {data['errors']}")
            return None
        return data.get("data", {})
    except requests.exceptions.RequestException as e:
        print(f"Error executing query: {e}")
        return None

# Fetch top tokens for a specific network
def get_top_tokens(network_id, limit=5):
    query = f"""
    {{
        listTopTokens(
            limit: {limit},
            networkFilter: [{network_id}]
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

# Fetch metadata for each token
def get_pairs_with_metadata(token_address, network_id):
    query = f"""
    query {{
        listPairsWithMetadataForToken(
            tokenAddress: "{token_address}",
            networkId: {network_id}
        ) {{
            results {{
                pair {{
                    address
                    fee
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

# Fetch token prices
def prepare_price_inputs(top_tokens, network_id):
    return [{"address": token["address"], "networkId": network_id} for token in top_tokens]

def get_token_prices(inputs):
    query = """
    query getTokenPrices($inputs: [GetPriceInput]!) {
        getTokenPrices(inputs: $inputs) {
            address
            confidence
            networkId
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
            print(f"GraphQL Errors: {data['errors']}")
            return None
        return data.get("data", {}).get("getTokenPrices", [])
    except requests.exceptions.RequestException as e:
        print(f"Error executing query: {e}")
        return None

# Main function
def main():
    # Initialize database connection
    db = DatabaseInterface(host=db_host, database=db_name, user=db_user, password=db_password)
    print(f"Script started at {datetime.now().isoformat()}")

    try:
        for network_name, network_id in allowed_networks.items():
            print(f"Fetching tokens for network: {network_name} (ID: {network_id})")
            top_tokens = get_top_tokens(network_id)

            # Fetch and insert prices into dynamic_tokens
            price_inputs = prepare_price_inputs(top_tokens, network_id)
            token_prices = get_token_prices(price_inputs)

            for token, price in zip(top_tokens, token_prices):
                try:
                    price_record = {
                        "address": price["address"],
                        "name": token.get("name", "Unknown"),
                        "symbol": token.get("symbol", "Unknown"),
                        "price": price["priceUsd"],
                        "market_cap": token.get("marketCap", 0),
                        "network_id": network_id,
                        "network_name": network_name,
                        "timestamp": datetime.utcfromtimestamp(price["timestamp"]).isoformat()
                    }
                    db.add("dynamic_tokens", price_record)
                   # print(f"Inserted token record into dynamic_tokens: {price_record}")
                except Exception as e:
                    print(f"Error inserting token record into dynamic_tokens: {e}")

            # Fetch and insert pairs into dynamic_pairs
            for token in top_tokens:
                pairs_metadata = get_pairs_with_metadata(token["address"], network_id)
                for pair in pairs_metadata:
                    try:
                        pair_dynamic_record = {
                            "token_address": token["address"],
                            "token_name": token["name"],
                            "pair_address": pair["pair"]["address"],
                            "fee": pair["pair"]["fee"],
                            "backing_token_address": pair["backingToken"]["address"],
                            "backing_token_name": pair["backingToken"]["name"],
                            "exchange_address": pair["exchange"]["address"],
                            "exchange_name": pair["exchange"]["name"],
                            "volume": pair.get("volume", 0),
                            "liquidity": pair.get("liquidity", 0),
                            "timestamp": get_current_timestamp()
                        }
                        db.add("dynamic_pairs", pair_dynamic_record)
                       # print(f"Inserted pair dynamic record: {pair_dynamic_record}")
                    except Exception as e:
                        print(f"Error inserting pair record into dynamic_pairs: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    main()