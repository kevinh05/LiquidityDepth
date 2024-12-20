import ccxt
import asyncio

async def fetch_all_exchanges_data():
    """
    Dynamically fetches data for all available exchanges and pairs at regular intervals.
    """
    try:
        # Dynamically get all exchanges supported by ccxt
        exchange_ids = ccxt.exchanges

        # Create exchange instances and fetch live data
        for exchange_id in exchange_ids:
            try:
                exchange_class = getattr(ccxt, exchange_id)
                exchange = exchange_class({'enableRateLimit': True})
                
                # Load markets for the exchange
                markets = exchange.load_markets()
                print(f"\n=== {exchange_id.upper()} ===")
                
                for symbol, market in markets.items():
                    # Skip inactive markets
                    if not market['active']:
                        continue

                    # Fetch ticker data
                    ticker = exchange.fetch_ticker(symbol)

                    # Fetch order book to calculate liquidity
                    order_book = exchange.fetch_order_book(symbol)
                    bids = order_book.get('bids', [])
                    asks = order_book.get('asks', [])
                    current_price = ticker.get('last')

                    # Calculate bid and ask liquidity (within 1% price range)
                    bid_liquidity = sum(volume for item in bids if len(item) >= 2 for price, volume in [item] if price >= current_price * 0.99) if current_price else 0
                    ask_liquidity = sum(volume for item in asks if len(item) >= 2 for price, volume in [item] if price <= current_price * 1.01) if current_price else 0
                    total_liquidity = bid_liquidity + ask_liquidity

                    # Print the fetched data including liquidity
                    print({
                        "exchange": exchange_id,
                        "symbol": symbol,
                        "bid": ticker.get('bid'),
                        "ask": ticker.get('ask'),
                        "volume": ticker.get('baseVolume'),
                        "last_price": ticker.get('last'),
                        "bid_liquidity": bid_liquidity,
                        "ask_liquidity": ask_liquidity,
                        "total_liquidity": total_liquidity
                    })
            except Exception as e:
                print(f"Error fetching data from {exchange_id}: {e}")
    
    except Exception as e:
        print(f"Error in fetch_all_exchanges_data: {e}")

# Run the script
if __name__ == "__main__":
    asyncio.run(fetch_all_exchanges_data())
