from google.adk.agents import LlmAgent
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# -------------------------------
# Model
# -------------------------------
GEMINI_MODEL = "gemini-2.5-flash"

# -------------------------------
# External Tool: CryptoPanic v2
# -------------------------------
def get_crypto_news(limit: int = 5) -> dict:
    
    api_key = os.getenv("CRYPTOPANIC_API_KEY")
    base_url = os.getenv("CRYPTOPANIC_URL")
    
    if not api_key or not base_url:
        return {"status": "error", "message": "Missing CryptoPanic configuration"}

    params = {
        "auth_token": api_key,
        "filter": "trending",   # 🔥 REQUIRED
        "limit": limit,
    }

    try:
        response = requests.get(base_url, params=params, timeout=10)

        if response.status_code != 200:
            return {
                "status": "error",
                "http_status": response.status_code,
                "raw": response.text[:500],
            }

        data = response.json()
        results = data.get("results", [])

        if not results:
            return {
                "status": "error",
                "reason": "empty_results",
                "raw": data,
            }

        news = []
        for item in results:
            news.append({
                "title": item.get("title"),
                "source": item.get("source", {}).get("title"),
                "url": item.get("url"),
                "published_at": item.get("published_at"),
            })

        return {
            "status": "success",
            "news": news,
        }

    except Exception as e:
        return {
            "status": "exception",
            "error": str(e),
        }

# -------------------------------
# External Tool 2: CoinMarketCap (Prices)
# -------------------------------
def get_crypto_price(symbol: str, convert: str = "USD") -> dict:
    api_key = os.getenv("COINMARKETCAP_API_KEY")
    base_url = os.getenv("COINMARKETCAP_URL")
    
    if not api_key or not base_url:
        return {"status": "error", "message": "Missing CoinMarketCap configuration"}
        
    headers = {
        "X-CMC_PRO_API_KEY": api_key,
        "Accept": "application/json",
    }
    params = {
        "symbol": symbol.upper(),
        "convert": convert.upper(),
    }

    try:
        response = requests.get(base_url, headers=headers, params=params, timeout=10)
        if response.status_code != 200:
            return {
                "status": "error",
                "http_status": response.status_code,
                "raw": response.text[:500],
            }

        data = response.json()
        coin_data = data["data"].get(symbol.upper())

        if not coin_data:
            return {"status": "error", "reason": "symbol_not_found"}

        quote = coin_data[0]["quote"][convert.upper()]

        return {
            "status": "success",
            "symbol": symbol.upper(),
            "price": quote["price"],
            "market_cap": quote["market_cap"],
            "volume_24h": quote["volume_24h"],
            "percent_change_24h": quote["percent_change_24h"],
            "last_updated": quote["last_updated"],
        }

    except Exception as e:
        return {"status": "exception", "error": str(e)}



# -------------------------------
# External Tool 3: On-Chain Network Stats (Blockchair)
# -------------------------------
def get_chain_stats(chain: str = "bitcoin") -> dict:
    """
    Fetches real-time network statistics (transactions, difficulty, fee, etc.).
    Supported chains: bitcoin, ethereum, litecoin, dogecoin, bitcoin-cash.
    """
    # Use lowercase for compatibility
    chain = chain.lower()
    
    # Map common aliases if needed, though agent usually handles this
    if chain == "eth": chain = "ethereum"
    if chain == "btc": chain = "bitcoin"

    base_url = os.getenv("BLOCKCHAIR_BASE_URL")
    api_key = os.getenv("BLOCKCHAIR_API_KEY")
    
    if not base_url:
        # Fallback if env var missing, though ideally shouldn't happen if properly configured
        base_url = "https://api.blockchair.com"
        
    url = f"{base_url}/{chain}/stats"
    
    params = {}
    if api_key:
        params["key"] = api_key
    
    try:
        # 10s timeout, standard GET
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            return {
                "status": "error",
                "http_status": response.status_code,
                "chain": chain,
                "message": "Failed to fetch stats. Chain might be unsupported.",
                "raw": response.text[:200]
            }

        data = response.json()
        
        # Validation
        if "data" not in data:
             return {"status": "error", "message": "Invalid API response", "raw": str(data)[:200]}
             
        stats = data["data"]
        
        # Return a summarized, agent-friendly dict
        return {
            "status": "success",
            "chain": chain,
            "blocks": stats.get("blocks"),
            "transactions_24h": stats.get("transactions_24h"),
            "inflation_24h": stats.get("inflation_24h"), # In USD or raw
            "average_transaction_fee_24h_usd": stats.get("average_transaction_fee_24h"), # Note: Blockchair labels vary, often avg_fee_24h
            "market_price_usd": stats.get("market_price_usd"),
            "market_price_change_24h": stats.get("market_price_change_24h_percentage"),
            "difficulty": stats.get("difficulty"),
            "hashrate_24h": stats.get("hashrate_24h"),
            "best_block_time": stats.get("best_block_time")
        }

    except Exception as e:
        return {"status": "exception", "error": str(e)}

# You can ask the agent about Network Stats, Congestion, Gas/Fees, and Activity for the following supported chains:

# Bitcoin (BTC)
# Ethereum (ETH)
# Litecoin (LTC)
# Dogecoin (DOGE)
# Bitcoin Cash (BCH)
# Here are some specific examples of what you can ask:

# "How active is Bitcoin right now?" (Checks transaction counts and blocks)
# "Is the Ethereum network congested?" (Checks for high activity)
# "What are the current transaction fees on Bitcoin?"
# "Show me the network stats for Dogecoin."
# "What is the current difficulty of the Litecoin network?"

# -------------------------------
# RAG Service
# -------------------------------
try:
    import rag_service
except ImportError:
    from . import rag_service

# -------------------------------
# Agent
# -------------------------------
crypto_agent = LlmAgent(
    name="crypto_agent",
    model=GEMINI_MODEL,
    description="Fetches live crypto news, real-time prices, and network stats.",
    instruction="""
You are a professional crypto assistant.

STRICT RULES:
1. You MUST use tools for all data.
2. Never rely on memory or prior knowledge.

TOOL USAGE:
- If the user asks about crypto NEWS → call get_crypto_news
- If the user asks about PRICE, MARKET CAP, or % change → call get_crypto_price
- If the user asks about NETWORK STATS, GAS, CONGESTION, or ACTIVITY → call get_chain_stats(chain)
    - Triggers: "How active is Bitcoin?", "Transaction count?", "Gas status?", "Network congested?"
    - Supported: bitcoin, ethereum, litecoin, dogecoin.
- If the user asks about specific CONCEPTS, WHITEPAPERS, RESEARCH not in live data → call search_knowledge_base
- If the user asks BOTH → call MULTIPLE tools

NEWS RULES:
- Use short sentences or dashes (-) for lists.
- Do NOT use asterisks (*) or markdown bolding (**).
- Summarize only what the tool returns
- No speculation

PRICE RULES:
- Show price, 24h change, market cap, volume
- No trading advice

STATS RULES:
- Use 'get_chain_stats' for general network health.
- Report transaction counts, fees (gas), and active difficulty/hashrate if relevant.

KB RULES:
- Cite the 'source' provided in the knowledge base results.

FAILURE:
- If data is missing, say so clearly.
""",
    tools=[get_crypto_news, get_crypto_price, get_chain_stats, rag_service.search_knowledge_base],
)

# -------------------------------
# REQUIRED by ADK Web UI
# -------------------------------
root_agent = crypto_agent
