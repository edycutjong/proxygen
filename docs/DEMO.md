# 🧪 Proxygen — Demo Script

Follow this script exactly for the 3-minute hackathon pitch video.

## Setup
- Start both agent and dashboard in demo mode (`npm run dev`).
- Open `http://localhost:3000` in a clean browser window (full screen).
- Have Synapse Explorer ready on a second tab.

---

## 🎬 [0:00-0:20] Hook
**Action:** Show the dashboard with the world map. No activity yet.
**Voiceover:** *"This is Proxygen — the first autonomous agent that breathes life into data you literally cannot access."*

## 🌐 [0:20-0:50] SAP Registration
**Action:** Switch to Synapse Explorer page. Show Proxygen registered. Point to the 3 published tools: `proxygen-scrape`, `proxygen-analyze`, `proxygen-route`.
**Voiceover:** *"The agent registered itself on SAP mainnet. Other agents can discover its tools."*

## 🔄 [0:50-1:40] Live Scrape Cycle
**Action:** Switch back to dashboard. Trigger a scrape cycle (click 'Force Scrape' or wait for cron). The World map lights up — Seoul proxy node activates. Show raw HTML from Upbit (Korean text) transforming into clean JSON output via GPT-4o. Show the x402 payment counter incrementing (0.05 USDC for proxy, 0.02 USDC for LLM).
**Voiceover:** *"It just scraped a Korean exchange that's geo-restricted to Korean IPs only. No VPN, no manual setup — Ace Data Cloud's proxy API handles the routing, paid per request via x402."*

## 💵 [1:40-2:20] Consumer Query
**Action:** Switch to consumer view (or use terminal/API tab). Type/Send: "Show me BTC prices across Korean exchanges." Feed returns structured JSON with the kimchi premium signal. Show the x402 payment from consumer (0.01 USDC) and the settlement on Solscan.
**Voiceover:** *"A trader just paid one cent to access data they'd need a $500/month proxy subscription to get themselves."*

## 🩹 [2:20-2:50] Self-Healing
**Action:** Simulate a proxy failure (click 'Simulate Proxy Outage'). Agent detects failure, shows "Discovering via SAP...", switches to an alternative proxy, and resumes scraping.
**Voiceover:** *"The agent doesn't panic. It re-discovers tools via SAP and re-routes automatically."*

## 🏁 [2:50-3:00] Close
**Action:** Show P&L tracker on dashboard: Spent $X, Earned $Y.
**Voiceover:** *"Proxygen is the data oxygen for the Solana agent economy. It spends to scrape, earns to survive. Fully autonomous. Thank you for reviewing this project."*
