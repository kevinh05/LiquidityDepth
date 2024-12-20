import psycopg2
import pandas as pd
import matplotlib.pyplot as plt

# Database connection configuration
DB_CONFIG = {
    'dbname': 'your_db_name',
    'user': 'your_user',
    'password': 'your_password',
    'host': 'your_host',
    'port': 'your_port'
}

# Function to fetch liquidity data from the database
def fetch_liquidity_data(exchange_id):
    query = """
        SELECT symbol, bid_liquidity, ask_liquidity, total_liquidity
        FROM trading_pairs
        WHERE exchange_id = %s
        ORDER BY total_liquidity DESC;
    """
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute(query, (exchange_id,))
            rows = cur.fetchall()
            return pd.DataFrame(rows, columns=['symbol', 'bid_liquidity', 'ask_liquidity', 'total_liquidity'])
    except Exception as e:
        print(f"Error fetching liquidity data: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# Function to generate and save the liquidity visualization
def generate_visualization(exchange_id, exchange_name):
    # Fetch liquidity data
    data = fetch_liquidity_data(exchange_id)

    if data.empty:
        print(f"No data available for exchange: {exchange_name}")
        return

    # Sort data by total liquidity for better visualization
    data = data.sort_values(by='total_liquidity', ascending=False)

    # Plot the data
    plt.figure(figsize=(12, 6))
    plt.bar(data['symbol'], data['bid_liquidity'], label='Bid Liquidity', alpha=0.7)
    plt.bar(data['symbol'], data['ask_liquidity'], label='Ask Liquidity', alpha=0.7, bottom=data['bid_liquidity'])

    # Add labels and title
    plt.xlabel('Trading Pair')
    plt.ylabel('Liquidity')
    plt.title(f'Liquidity Distribution for {exchange_name}')
    plt.xticks(rotation=45, ha='right')
    plt.legend()

    # Save the plot as an image
    plt.tight_layout()
    plt.savefig(f'{exchange_name}_liquidity_visualization.png')
    plt.show()

# Example usage
if __name__ == "__main__":
    exchange_id = "binanceus"  # Example exchange ID
    exchange_name = "Binance US"
    generate_visualization(exchange_id, exchange_name)