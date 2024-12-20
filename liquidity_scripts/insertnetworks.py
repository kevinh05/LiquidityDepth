import psycopg2
import os
import requests
from dotenv import load_dotenv

def fetch_networks_from_api():
    """
    Fetch networks dynamically using an API.
    Replace with your actual API call logic.
    """
    url = "https://graph.codex.io/graphql"  # Replace with the actual API URL
    query = """
    {
        getNetworks {
            id
            name
        }
    }
    """
    headers = {
        "Content-Type": "application/json",
        "Authorization": os.getenv("API_KEY")  # Ensure API key is in the .env file
    }
    try:
        response = requests.post(url, headers=headers, json={"query": query})
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            print("GraphQL Errors:", data["errors"])
            return []
        return data.get("data", {}).get("getNetworks", [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching networks: {e}")
        return []

def insert_networks(networks):
    """
    Insert networks into the PostgreSQL database.
    :param networks: List of networks (each network is a dictionary with "id" and "name").
    """
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT", "5432")
        )
        cursor = conn.cursor()

        # Insert networks
        for network in networks:
            query = """
            INSERT INTO networks (id, name)
            VALUES (%s, %s)
            ON CONFLICT (id) DO NOTHING;
            """
            cursor.execute(query, (network["id"], network["name"]))
            print(f"Inserted network: {network['name']}")

        # Commit the transaction
        conn.commit()

    except psycopg2.Error as e:
        print(f"Error inserting networks: {e}")

    finally:
        # Close the database connection
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()

    # Fetch networks dynamically from API
    networks = fetch_networks_from_api()
    if not networks:
        print("No networks fetched from API. Exiting...")
    else:
        # Insert the networks into the database
        insert_networks(networks)
