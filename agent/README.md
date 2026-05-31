# Proxygen Agent

The autonomous web scraping backend powered by Fastify, Ace Data Cloud, and OOBE Protocol.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# ── Mode ─────────────────────────────────────────────────────
PROXYGEN_DEMO=true

# ── Server ───────────────────────────────────────────────────
PORT=3001
HOST=0.0.0.0

# ── Ace Data Cloud ───────────────────────────────────────────
ACE_API_URL=https://api.acedata.cloud
ACE_NETWORK=solana

# ── OOBE Protocol / SAP ─────────────────────────────────────
OOBE_RPC_URL=https://synapse.oobeprotocol.ai
OOBE_CLUSTER=mainnet-beta
OOBE_API_KEY=sk_your_oobe_api_key_here

# ── Solana Wallet ────────────────────────────────────────────
SOLANA_PRIVATE_KEY=your_base58_private_key_here

# ── Optional: EVM Wallet (for Base/SKALE x402) ──────────────
# Only needed if ACE_NETWORK=base or ACE_NETWORK=skale
# EVM_PRIVATE_KEY=0xyour_evm_private_key_here

# ── Agent Identity ───────────────────────────────────────────
AGENT_X402_ENDPOINT=http://localhost:3001/x402

# ── Scraping Configuration ───────────────────────────────────
SCRAPE_INTERVAL_MS=600000
SCRAPE_MAX_CONCURRENT=3
FEED_TTL_MS=3600000
MAX_FEED_ITEMS=500

# ── LLM Configuration ───────────────────────────────────────
LLM_PRIMARY_MODEL=gpt-4o-mini
LLM_FALLBACK_MODEL=deepseek-v3
LLM_MAX_TOKENS=1000
```

## Running Locally

```bash
npm install
npm run dev
```
