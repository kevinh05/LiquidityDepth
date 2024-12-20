import requests
import os
from dotenv import load_dotenv
from db_interface import DatabaseInterface

# Load environment variables
load_dotenv()

# Define GraphQL endpoint and headers
url = "https://graph.codex.io/graphql"
api_key = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API key is missing!")

headers = {
    "Content-Type": "application/json",
    "Authorization": api_key
}

allowed_networks = {
    "Ethereum": 1,
    "Polygon": 137,
    "Base": 8453,
    "Solana": 1399811149,
    "Binance Smart Chain": 56,
    "Arbitrum": 42161,
    "Optimism": 10
}

# GraphQL query execution
def execute_query(query):
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()
        return response.json().get("data", {})
    except Exception as e:
        print(f"Error executing query: {e}")
        return None

# Fetch top tokens
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
        }}
    }}
    """
    return execute_query(query).get("listTopTokens", [])

# Fetch pairs metadata
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
                backingToken {{
                    address
                    name
                }}
                exchange {{
                    address
                    name
                }}
            }}
        }}
    }}
    """
    return execute_query(query).get("listPairsWithMetadataForToken", {}).get("results", [])

# Main function
def main():
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")

    db = DatabaseInterface(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password
    )

    try:
        for network_name, network_id in allowed_networks.items():
            print(f"Fetching tokens for network: {network_name}")
            tokens = get_top_tokens(network_id)

            for token in tokens:
                # Insert into static_tokens table
                token_data = {
                    "network_id": network_id,
                    "name": token["name"],
                    "address": token["address"],
                    "symbol": token["symbol"]
                }
                db.add("static_tokens", token_data)

                # Fetch and insert pairs
                pairs = get_pairs_with_metadata(token["address"], network_id)
                for pair in pairs:
                    pair_data = {
                        "token_address": token["address"],
                        "token_name": token["name"],
                        "pair_address": pair["pair"]["address"],
                        "fee": pair["pair"]["fee"],
                        "backing_token_address": pair["backingToken"]["address"],
                        "backing_token_name": pair["backingToken"]["name"],
                        "exchange_address": pair["exchange"]["address"],
                        "exchange_name": pair["exchange"]["name"]
                    }
                    db.add("pairs", pair_data)
    finally:
        db.close()

if __name__ == "__main__":
    main()