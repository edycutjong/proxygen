# 🧪 Proxygen — Submission Materials

## Project Title
**Proxygen — Autonomous Global Data Intelligence Agent**

## Emotional Hook
> A quant analyst in Jakarta spends 4 hours every morning scraping crypto prices from 3 geo-restricted Korean exchanges, manually cleaning the HTML, and formatting it into a spreadsheet — by the time her data is ready, the alpha is gone.

## Short Description (150 chars)
Autonomous agent that scrapes geo-restricted data via global proxies, structures it with AI, and sells clean feeds — all paid via x402 micropayments.

## Long Description (500 words)

### The Problem
Global market data is locked behind geo-restrictions, anti-bot protections, and rate limits. A trader in New York can't see Upbit's order book (Korean IPs only). An analyst in Singapore can't scrape Weibo's crypto sentiment (Chinese IPs only). Building and maintaining scrapers for dozens of global sources costs $5K-$50K/year in proxy subscriptions, VPS hosting, and manual maintenance. When a proxy fails or a source changes its HTML structure, data goes dark until a human intervenes.

### The Solution
**Proxygen** is the first fully autonomous data intelligence agent on Solana. It uses Ace Data Cloud's residential and mobile HTTP proxy APIs — a completely unique service stack that no other submission leverages — to scrape geo-restricted data sources across 3+ global regions. Raw HTML is then structured into clean, typed JSON using Ace Data Cloud's GPT-4o and DeepSeek-V3 LLM APIs. The resulting intelligence feeds are published as x402-gated SAP endpoints that anyone — traders, protocols, or other agents — can query by paying a few cents per request.

### How It Works
1. **Discover** — The agent registers on SAP mainnet and discovers optimal proxy/AI tools via the SAP registry
2. **Scrape** — Every 10 minutes, the agent scrapes 10-20 geo-restricted sources via Ace Data Cloud's proxy API, paying per request via x402
3. **Structure** — Raw HTML is passed to GPT-4o for extraction into typed JSON (symbol, price, volume, sentiment, confidence score)
4. **Sell** — Clean data feeds are published as SAP-registered tools. Consumers pay per query via x402
5. **Self-Heal** — If a proxy region fails, the agent autonomously re-discovers alternatives via SAP

### What Makes It Autonomous
There are **zero manual steps** after the initial deployment:
- Source monitoring runs on a cron schedule
- Proxy selection is dynamic via SAP discovery
- Payment flows are fully autonomous (x402 outflow for API costs, x402 inflow from consumers)
- Failover is automatic via SAP re-discovery

### Ace Data Cloud Integration (5+ Services)
Proxygen uses a **completely differentiated** slice of Ace Data Cloud's service catalog:
1. **HTTP Proxy API (Residential)** — Geo-restricted scraping in US/EU regions
2. **HTTP Proxy API (Mobile)** — Mobile-specific sources in KR/CN regions
3. **GPT-4o Chat Completions** — Structured data extraction from raw HTML
4. **DeepSeek-V3** — Cost-optimized fallback LLM for high-volume extraction
5. **Web Search API** — Autonomous discovery of new data sources

No other submission uses Ace Data Cloud's proxy APIs. This is the project's structural advantage.

### x402 Economic Loop
Proxygen demonstrates a **dual-flow x402 economy**:
- **Spends** USDC on proxy access (~0.05/call) and LLM extraction (~0.02/call)
- **Earns** USDC from data consumers (~0.005-0.02/query)
- Every transaction is settled on Solana with verifiable Solscan receipts

### Demo
The demo shows a live scraping cycle: Korean exchange data (Upbit, Bithumb) is scraped via proxy, structured by GPT-4o, and delivered to a consumer — with real x402 payments settling on Solana in real-time. The highlight: a **3.2% kimchi premium** signal extracted from sources that US traders physically cannot access.

## Demo Video Script (2-3 min)

### [0:00-0:20] Hook
*"This is Proxygen — the first autonomous agent that breathes life into data you literally cannot access."*
Show: Dashboard with world map, no activity yet.

### [0:20-0:50] SAP Registration
Show Synapse Explorer page with Proxygen registered.
Point out the 3 published tools: `proxygen-scrape`, `proxygen-analyze`, `proxygen-route`.
*"The agent registered itself on SAP mainnet. Other agents can discover its tools."*

### [0:50-1:40] Live Scrape Cycle
Trigger a scrape cycle. World map lights up — Seoul proxy node activates.
Show: Raw HTML from Upbit (Korean text) → GPT-4o extraction → Clean JSON output.
Show: x402 payment counter incrementing (0.05 USDC for proxy, 0.02 USDC for LLM).
*"It just scraped a Korean exchange that's geo-restricted to Korean IPs only. No VPN, no manual setup — Ace Data Cloud's proxy API handles the routing, paid per request via x402."*

### [1:40-2:20] Consumer Query
Switch to consumer view. Type: "Show me BTC prices across Korean exchanges."
Feed returns: structured JSON with kimchi premium signal.
Show: x402 payment from consumer (0.01 USDC) → settlement on Solscan.
*"A trader just paid one cent to access data they'd need a $500/month proxy subscription to get themselves."*

### [2:20-2:50] Self-Healing
Simulate proxy failure (Korean region down).
Show: Agent detects failure → SAP discovery → switches to alternative proxy → resumes scraping.
*"The agent doesn't panic. It re-discovers tools via SAP and re-routes automatically."*

### [2:50-3:00] Close
Show P&L tracker: spent $X, earned $Y.
*"Proxygen is the data oxygen for the Solana agent economy. It spends to scrape, earns to survive. Fully autonomous. Thank you for reviewing this project."*

## Track/Category Selection
- **Category A** (Primary): General Payment Volume on SAP — high-frequency x402 transactions (700+ API calls/day)
- **Category B** (Secondary): Best Ace Data Cloud AI Integration — 5+ distinct services including unique proxy APIs

## X Post Template
```
🧪 Proxygen — Autonomous Global Data Intelligence Agent

The first agent that uses @AceDataCloud's proxy APIs to scrape geo-restricted data, structures it with AI, and sells feeds via x402 micropayments.

🔗 Live App: https://proxygen-dashboard-production.up.railway.app
🔗 API Endpoint: https://proxygen-agent-production.up.railway.app
🔗 Demo: https://youtu.be/dQw4w9WgXcQ
🔗 GitHub: https://github.com/edycutjong/proxygen
🏷️ Category: A + B

Built for @OOBEonSol × @AceDataCloud Autonomous Agent Bounty

#Proxygen #OOBE #AceDataCloud #Solana #x402 #AutonomousAgent
```

## Personal Sign-off
Thank you for your time reviewing this project. Building Proxygen has been a deep dive into the OOBE ecosystem — the SAP discovery protocol and x402 payment rails are genuinely impressive infrastructure. I'm excited about the future of autonomous agent economics on Solana.
