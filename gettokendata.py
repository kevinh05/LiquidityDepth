import requests
import json


# Define the GraphQL endpoint
url = "https://graph.codex.io/graphql"

#Store API key in env file
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("API_KEY")

# Set up the headers
headers = {
    "Content-Type": "application/json",
    "Authorization": api_key  
}

# Define a function to dynamically fetch token info
def fetch_token_info(token_address, network_id):
    
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
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()  # Raise an error for HTTP issues
        data = response.json()
        if "errors" in data:
            print("GraphQL Errors:", data["errors"])
        else:
            return data["data"]["listPairsWithMetadataForToken"]["results"]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching token info: {e}")
        return None

# Call the function with a specific tokenAddress and networkId
token_address = "0x28561b8a2360f463011c16b6cc0b0cbef8dbbcad"
network_id = 1

results = fetch_token_info(token_address, network_id)

# Print the results if available
if results:
    for index, item in enumerate(results):
        print(f"Pair {index + 1}:")
        print(f"  Pair Address: {item['pair']['address']}")
        print(f"  Pair Fee: {item['pair']['fee']}")
        print(f"  Backing Token Address: {item['backingToken']['address']}")
        print(f"  Backing Token Name: {item['backingToken']['name']}")
        print(f"  Exchange Address: {item['exchange']['address']}")
        print(f"  Exchange Name: {item['exchange']['name']}")
        print(f"  Volume: {item['volume']}")
        print(f"  Liquidity: {item['liquidity']}")
        print('-----------------------------------')
