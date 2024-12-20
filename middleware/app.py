from flask import Flask, jsonify, request
from psycopg2 import connect, sql
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask_cors import CORS
import os
import base64

# Load environment variables from .env file
load_dotenv()

# Database connection configuration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT')
}

def unhash_str(hashed_string):
    """
    Unhash a string back into an url-safe string.
    """
    try:
        padding = len(hashed_string) % 4
        if padding:
            hashed_string += '=' * (4 - padding)
        decoded = base64.urlsafe_b64decode(hashed_string).decode()
        return decoded
    except Exception as e:
        return None

def unhash_list(hashed_string):
    """
    Unhash a string back into a list of exchanges.
    """
    try:
        padding = len(hashed_string) % 4
        if padding:
            hashed_string += '=' * (4 - padding)
        decoded = base64.urlsafe_b64decode(hashed_string).decode()
        return decoded.split(",")
    except Exception as e:
        return None

def sample_rows(rows, k):
    # Calculate the step size for even sampling
    step = max(len(rows) // k, 1)
    
    # Sample rows at calculated intervals
    rows = rows[::step][:k]

    return rows


# Initialize Flask application
app = Flask(__name__)
CORS(app)
# Function to get database connection
def get_db_connection():
    return connect(**DB_CONFIG)





# Endpoint to fetch all trading pairs
@app.route('/api/trading_pairs', methods=['GET'])
def get_all_trading_pairs():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM ohlcv_data;")
            rows = cur.fetchall()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Endpoint to fetch trading pairs by exchange
@app.route('/api/trading_pairs/exchange/<string:exchange>', methods=['GET'])
def get_trading_pairs_by_exchange(exchange):
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM ohlcv_data WHERE exchange = %s;", (exchange,))
            rows = cur.fetchall()
        if not rows:
            return jsonify({"error": "No trading pairs found for the specified exchange"}), 404
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Endpoint to fetch a specific trading pair by exchange and symbol
@app.route('/api/trading_pairs/<string:exchange>/<string:symbol>', methods=['GET'])
def get_trading_pair(exchange, symbol):
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM trading_pairs WHERE exchange_id = %s AND symbol = %s;", (exchange, symbol))
            row = cur.fetchone()
        if not row:
            return jsonify({"error": "Trading pair not found"}), 404
        return jsonify(row), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/ohlcv/<string:hashed_exchanges>/<string:hashed_symbol>/<string:start_time>/<string:end_time>', methods=['GET'])
def get_trading_pairs(hashed_exchanges, hashed_symbol, start_time, end_time):
    try:
        # Unhash the exchanges list
        exchanges = unhash_list(hashed_exchanges)
        placeholders = ','.join(['%s'] * len(exchanges))

        symbol = unhash_str(hashed_symbol)
        sTime = unhash_str(start_time)
        eTime = unhash_str(end_time)

        print(sTime, eTime)

        k = 1000 # k determines the granularity of the data points returned per exchange
        if not exchanges:
            return jsonify({"error": "Invalid exchanges parameter"}), 400

        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Query for all matching trading pairs
            query = f"""
            WITH exchange_data AS (
                    SELECT *,
                           ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY timestamp) AS row_num,
                           COUNT(*) OVER (PARTITION BY exchange) AS total_rows
                    FROM ohlcv_data
                    WHERE exchange IN ({placeholders}) AND symbol = %s AND timestamp BETWEEN %s AND %s
                )
                SELECT *
                FROM exchange_data
                WHERE MOD(row_num, GREATEST(total_rows / %s, 1)) = 0 OR row_num = total_rows;
            """
           
            cur.execute(query, (*exchanges, symbol, sTime, eTime, k))
            rows = cur.fetchall()

        if not rows:
            return jsonify({"error": "No trading pairs found"}), 404
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/ohlcv/dex/<string:hashed_symbol>/<string:start_time>/<string:end_time>', methods=['GET'])
def get_trading_pairs_dex(hashed_symbol, start_time, end_time):
    # example: /api/ohlcv/dex/V0VUSC9VU0RD/MjAyNC0xMi0xNiAxMjozMDoxMA/MjAyNC0xMi0xNyAxNzozMDoxMA?network_id=42161
    #                        /WETH/USDC   /2024-12-16 12:30:10       /2024-12-17 17:30:10
    try:
        # Decode the URL-safe tokens
        symbol = unhash_str(hashed_symbol)
        sTime = unhash_str(start_time)
        eTime = unhash_str(end_time)

        network_id = request.args.get('network_id', type=int)

        k = 50 # k determines the granularity of the data points returned per exchange
        if not all([symbol, sTime, eTime]):
            return jsonify({"error": "Invalid exchanges parameter"}), 400

        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            network_id_query = f"AND network_id = {network_id}" if network_id else ""
            # Query for all matching trading pairs
            # query = f"""
            # WITH exchange_data AS (
            #         SELECT *,
            #                ROW_NUMBER() OVER (PARTITION BY exchange ORDER BY timestamp) AS row_num,
            #                COUNT(*) OVER (PARTITION BY exchange) AS total_rows
            #         FROM ohlcv_data
            #         WHERE symbol = %s AND (timestamp BETWEEN %s AND %s) AND network_id IS NOT NULL {network_id_query}
            #     )
            #     SELECT *
            #     FROM exchange_data
            #     WHERE MOD(row_num, GREATEST(total_rows / %s, 1)) = 1 OR row_num = total_rows;
            # """
            query = f"""
                SELECT *
                FROM ohlcv_data
                WHERE symbol = %s AND (timestamp BETWEEN %s AND %s) AND network_id IS NOT NULL {network_id_query}
                ORDER BY timestamp ASC;
            """
           
            cur.execute(query, (symbol, sTime, eTime))
            rows = cur.fetchall()
            
        if not rows:
            return jsonify({"error": "No trading pairs found"}), 404
        
        if len(rows) > k:
            rows = sample_rows(rows, k)

        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Endpoint to fetch pair data between timerange a and b given a pair
@app.route('/api/dynamic_pairs/<string:hashed_symbol>/<string:start_time>/<string:end_time>', methods=['GET'])
def get_dynamic_pairs_data(hashed_symbol, start_time, end_time):
    # /api/dynamic_pairs/UGVwZSUyMFVuY2hhaW5lZC9XcmFwcGVkJTIwRXRoZXI/MjAyNC0xMi0xNSAxMjozMDoxMA/MjAyNC0xMi0xNiAxNzozMDoxMA
    #                   /Pepe%20Unchained/Wrapped%20Ether           /2024-12-15 12:30:10       /2024-12-16 17:30:10
    try:
        # Decode the URL-safe tokens
        symbol1, symbol2 = unhash_str(hashed_symbol).split("/")
        symbol1 = symbol1.strip().replace("%20", " ")
        symbol2 = symbol2.strip().replace("%20", " ")
        # Decode the URL-safe timestamps
        start_timestamp = unhash_str(start_time)
        end_timestamp = unhash_str(end_time)
        print(symbol1, symbol2, start_timestamp, end_timestamp)
        
        if not all([start_timestamp, end_timestamp, symbol1, symbol2]):
            return jsonify({"error": "Invalid input format"}), 400

        k = 50  # k determines the granularity of the data points returned per exchange
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # First find token name for each symbol
            query = f"""
                SELECT *
                FROM static_tokens
                WHERE symbol = %s
                LIMIT 1;
            """
            cur.execute(query, (symbol1,))
            token1 = cur.fetchone()
            cur.execute(query, (symbol2,))
            token2 = cur.fetchone()
            if not token1 or not token2:
                return jsonify({"error": "Token not found"}), 404
            token1, token2 = token1['name'], token2['name']

            # Query pairs where either token can be in either position
            query = f"""
                SELECT *
                FROM dynamic_pairs
                WHERE (
                        (token_name = %s AND backing_token_name = %s)
                        OR 
                        (token_name = %s AND backing_token_name = %s)
                    )
                    AND timestamp BETWEEN %s AND %s
                ORDER BY timestamp ASC;
            """
            
            cur.execute(query, (
                token1, token2,  # First pair possibility
                token2, token1,  # Second pair possibility (reversed)
                start_timestamp, end_timestamp
            ))
            rows = cur.fetchall()
            
            if not rows:
                return jsonify({
                    "error": f"No pairs found for tokens {token1} and {token2} in the specified time range"
                }), 404
            
            # If number of rows > k, evenly sample k rows
            if len(rows) > k:
                rows = sample_rows(rows, k)
                
            return jsonify(rows), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/token_history/<string:token>/<string:start_time>/<string:end_time>', methods=['GET'])
def get_token_history(token, start_time, end_time):
    # example: /api/token_history/UGVwZSUyMFVuY2hhaW5lZA/MjAyNC0xMi0xNiAxMjozMDoxMA/MjAyNC0xMi0xNyAxNzozMDoxMA
    #                            /Pepe%20Unchained      /2024-12-16 12:30:10       /2024-12-17 17:30:10
    try:
        # Decode the URL-safe tokens
        token = unhash_str(token).strip().replace("%20", " ")
        sTime = unhash_str(start_time)
        eTime = unhash_str(end_time)

        network_id = request.args.get('network_id', type=int)

        k = 50 # k determines the granularity of the data points returned per exchange
        if not all([token, sTime, eTime]):
            return jsonify({"error": "Invalid exchanges parameter"}), 400

        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            network_id_query = f"AND network_id = {network_id}" if network_id else ""
            # Query for all matching trading pairs
            query = f"""
                SELECT *
                FROM dynamic_tokens
                WHERE symbol = %s 
                AND (timestamp BETWEEN %s AND %s) 
                AND network_id IS NOT NULL 
                {network_id_query}
                ORDER BY timestamp ASC;
            """
            cur.execute(query, (token, sTime, eTime))
            rows = cur.fetchall()

        if not rows:
            return jsonify({"error": f"No token data found for {token}"}), 404

        # If number of rows > k, evenly sample k rows
        if len(rows) > k:
            rows = sample_rows(rows, k)

        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# Endpoint to get the address of a pair given exchange and symbol name from table
@app.route('/api/get_pair_addresses', methods=['GET'])
def get_pair_addresses():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT backing_token_name, exchange_name, pair_address FROM pairs;")
            rows = cur.fetchall()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Endpoint to get vis data
@app.route('/api/get_visualization', methods=['GET'])
def get_visualization():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * from ohlcv_data;")
            rows = cur.fetchall()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
        
@app.route('/api/get_all_exchange_names', methods=['GET'])
def get_all_exchange_names():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT DISTINCT exchange FROM ohlcv_data WHERE network_id IS NULL AND exchange NOT ILIKE 'uni%';")
            rows = cur.fetchall()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# Run the Flask application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv('FLASK_PORT', 1024))
