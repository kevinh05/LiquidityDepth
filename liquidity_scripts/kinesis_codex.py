import requests
import json
import os
import boto3
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

# Configuration
url = "https://graph.codex.io/graphql"
api_key = os.getenv("API_KEY")
kinesis_stream_name = os.getenv("KINESIS_STREAM_NAME")
aws_region = os.getenv("AWS_REGION", "us-east-2")

if not api_key:
    raise EnvironmentError("API key is missing!")
if not kinesis_stream_name:
    raise EnvironmentError("Kinesis stream name is missing!")

allowed_networks = {
    "Ethereum": 1,
    "Polygon": 137,
    "Base": 8453,
    "Solana": 1399811149,
    "Binance Smart Chain": 56,
    "Arbitrum": 42161,
    "Optimism": 10
}

# AWS Kinesis client
kinesis_client = boto3.client("kinesis", region_name=aws_region)

# Set up the headers for GraphQL requests
headers = {
    "Content-Type": "application/json",
    "Authorization": api_key
}

# Function to generate dynamic timestamps
def get_current_timestamp():
    """Generate the current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()

# Function to stream data to Kinesis
def stream_to_kinesis(record, partition_key):
    """
    Send a record to the Kinesis stream.
    :param record: The record data (as a dictionary).
    :param partition_key: A key used to partition the data in Kinesis.
    """
    try:
        response = kinesis_client.put_record(
            StreamName=kinesis_stream_name,
            Data=json.dumps(record),
            PartitionKey=partition_key
        )
        print(f"Streamed record: {record['type']} | Partition Key: {partition_key}")
    except Exception as e:
        print(f"Error streaming to Kinesis: {e}")
        # Optional: Log the error to a monitoring system (e.g., CloudWatch, Sentry)

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

# Fetch all networks
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
            print(f"GraphQL Errors: {data['errors']}")
            return None
        return data.get("data", {}).get("getTokenPrices", [])
    except requests.exceptions.RequestException as e:
        print(f"Error executing query: {e}")
        return None

# Main function
def main():
    for network_name, network_id in allowed_networks.items():
        # Fetch and stream tokens for the network
        top_tokens = get_top_tokens(network_id)
        for token in top_tokens:
            token_record = {
                "type": "token",
                "data": {
                    "name": token["name"],
                    "address": token["address"],
                    "symbol": token["symbol"],
                    "price": token["price"],
                    "market_cap": token["marketCap"],
                    "network_id": network_id,
                    "timestamp": get_current_timestamp(),
                    "network_name": network_name
                }
            }
            print(token_record)
            stream_to_kinesis(token_record, partition_key=token["address"])

        # Fetch and stream prices for tokens
        price_inputs = prepare_price_inputs(top_tokens, network_id)
        token_prices = get_token_prices(price_inputs)
        for price in token_prices:
            price_record = {
                "type": "price",
                "data": price,
                "timestamp": get_current_timestamp(),
                "network_id": network_id
            }
            print(price_record)
            stream_to_kinesis(price_record, partition_key=price["address"])

        # Fetch and stream pairs metadata for each token
        for token in top_tokens:
            pairs_metadata = get_pairs_with_metadata(token["address"], network_id)
            for pair in pairs_metadata:
                pair_record = {
                    "type": "pair_metadata",
                    "data": pair,
                    "timestamp": get_current_timestamp(),
                    "token_address": token["address"],
                    "network_id": network_id
                }
                print(pair_record)
                stream_to_kinesis(pair_record, partition_key=token["address"])

if __name__ == "__main__":
    main()