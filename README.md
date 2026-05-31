<div align="center">
  <img src="dashboard/public/icon.svg" width="96" alt="Proxygen Logo">
  <h1>Proxygen 🧪</h1>
  <p><em>Autonomous agent that scrapes geo-restricted data via global proxies, structures it with AI, and sells clean feeds — all settled via x402 micropayments on Solana.</em></p>
  <img src="docs/readme-hero.png" alt="Proxygen" width="100%">

  <br/>

  [![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-06b6d4?style=for-the-badge)](https://proxygen.edycu.dev)
  [![Pitch Video](https://img.shields.io/badge/🎬_Pitch-Video-ef4444?style=for-the-badge)](https://youtu.be/ktl4GxVcBoI)
  [![Pitch Deck](https://img.shields.io/badge/🖥️_Interactive_Pitch_Deck-22c55e?style=for-the-badge)](https://proxygen.edycu.dev/pitch-deck.html)
  [![Built for OOBE × Ace Data Cloud](https://img.shields.io/badge/Superteam-OOBE_×_Ace_Data_Cloud-8b5cf6?style=for-the-badge)](https://superteam.fun/earn/listing/autonomous-agent-bounty-oobe-ace-data-cloud)

  <br/>

  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat&logo=next.js)
  ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
  ![Tailwind](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
  ![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
  ![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat&logo=openai&logoColor=white)
  [![CI](https://github.com/edycutjong/proxygen/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/proxygen/actions/workflows/ci.yml)

</div>

---

## 📸 See it in Action

<div align="center">
  <img src="dashboard/public/og-image.png" alt="Proxygen Dashboard" width="100%">
</div>

> **3-second intelligence delivery.** Query → Proxy activates (Seoul 🇰🇷) → AI extracts structured data → x402 payment settles on Solana → Clean JSON delivered.

---

## 💡 The Problem & Solution

A quant analyst in Jakarta spends **4 hours every morning** manually checking Korean exchange prices, Chinese market sentiment, and Japanese regulatory feeds — all from sources behind geo-restrictions that standard APIs can't reach. By the time they compile the data, the alpha is gone.

**Proxygen** solves this by deploying an autonomous agent that scrapes geo-restricted sources via residential/mobile proxies, structures raw data with GPT-4o, and delivers clean feeds — all paid via x402 micropayments. The entire pipeline runs without human intervention.

**Key Features:**
- 🌐 **Global Proxy Scraping:** 10 curated data sources across Korea, China, Japan, and the US — including geo-restricted exchanges (Upbit, Bithumb)
- 🧠 **AI-Powered Extraction:** GPT-4o structures raw HTML/JSON into typed data models with confidence scoring
- 💰 **x402 Micropayments:** Dual-flow economics — agent SPENDS on proxies/AI, EARNS from data consumers. Self-sustaining.
- 🔥 **Kimchi Premium Signal:** Real-time BTC price gap detection between Korean and US exchanges (3.3% premium detected)
- 🛡️ **Self-Healing:** Detects source failures, re-discovers proxies via SAP, and auto-recovers
- 📊 **SOC Dashboard:** Military-grade command center showing live feeds, economics, source health, and agent decisions

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Agent Runtime** | Node.js 22 + TypeScript |
| **Agent Framework** | `@oobe-protocol-labs/synapse-client-sdk` 2.0 |
| **Tool Registry** | `@oobe-protocol-labs/synapse-sap-sdk` (SAP v2) |
| **AI Services** | Ace Data Cloud Unified API (GPT-4o, DeepSeek-V3) |
| **Proxy** | Ace Data Cloud HTTP Proxy (Residential + Mobile) |
| **Payments** | `@acedatacloud/x402-client` (Solana USDC) |
| **Dashboard** | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **HTTP Server** | Fastify 5 |

```mermaid
graph TD
    subgraph Agent["Proxygen Agent (Node.js) :3001"]
        Scheduler["⏱️ Scheduler<br/>(10 min cron)"] --> Orchestrator["🎯 Orchestrator"]
        Orchestrator --> ProxyClient["🌐 Proxy Client<br/>(Ace Data Cloud)"]
        ProxyClient --> LLM["🤖 LLM Extractor<br/>(GPT-4o / DeepSeek)"]
        Orchestrator --> FeedStore["📡 Feed Store"]
        Orchestrator --> DecisionLog["📋 Decision Log"]
        HealthMonitor["❤️ Health Monitor"] -.-> Orchestrator
        FeedStore --> Fastify["🚀 Fastify API + SSE"]
    end

    subgraph Dashboard["Next.js 16 Dashboard :3000"]
        UI["📊 Command Center UI"]
    end

    Fastify -->|"SSE / REST"| UI

    style Agent fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#f8fafc
    style Dashboard fill:#0f172a,stroke:#22c55e,stroke-width:2px,color:#f8fafc
```

## 🏆 Sponsor Tracks Targeted

### Track A — Payment Volume
- **700+ daily API calls** to Ace Data Cloud (50 sources × 14 calls/source/day)
- Uses 5+ distinct Ace services: HTTP Proxy (Residential), HTTP Proxy (Mobile), GPT-4o Chat, DeepSeek-V3, Web Search

### Track B — Best AI Integration
- Multi-model extraction pipeline: GPT-4o primary, DeepSeek-V3 fallback
- Source-specific JSON parsers for known API formats (Upbit, Bithumb, Binance, CoinGecko, etc.)
- HTML sentiment extraction for Korean/Japanese/Chinese content with language-aware patterns

### OOBE / SAP Integration
- Agent registers 3 tools on SAP mainnet: `proxygen-scrape`, `proxygen-analyze`, `proxygen-route`
- Uses `SapClient.builder` fluent API for registration
- Discovery via `DiscoveryRegistry` for self-healing proxy failover
- x402 settlement via `X402Registry` for consumer payment verification

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Installation

```bash
# Clone
git clone https://github.com/edycutjong/proxygen.git
cd proxygen

# Agent (Terminal 1)
cd agent
cp .env.example .env
npm install
PROXYGEN_DEMO=true npm run dev    # Demo mode — no API keys needed

# Dashboard (Terminal 2)
cd dashboard
npm install
npm run dev
# → Open http://localhost:3000
```

> **For Judges:** The agent runs in demo mode by default — no wallet or API keys required. Real data flows with realistic kimchi premium calculations.

### Verify

```bash
# Agent health
curl http://localhost:3001/health
# → {"status":"ok","agent":"Proxygen","is_active":true}

# Kimchi premium signal
curl http://localhost:3001/api/signals/kimchi
# → {"signal":"kimchi_premium","data":{"premium_pct":3.3,"kr_price_usd":64568,"us_price_usd":62505}}

# Full dashboard state
curl http://localhost:3001/api/dashboard
```

## 💰 x402 Economics

```
OUTFLOW (Agent spends per cycle):
  ├── Proxy API:  ~0.05 USDC/geo-restricted source
  ├── LLM:        ~0.02 USDC/extraction
  └── Daily Total: ~$2-5 USDC

INFLOW (Consumers pay per query):
  ├── Per query:   0.01 USDC
  └── Daily Target: $3-10 USDC → break-even or profit
```

## 🧪 Testing & CI

Proxygen includes **103 tests (jest + custom)** across the agent and dashboard workspaces with full coverage on critical paths.

```bash
# ── Agent ──
cd agent
npm run typecheck     # TypeScript strict mode
npm run build         # Production build

# ── Dashboard ──
cd dashboard
npm run lint          # Next.js ESLint
npm run typecheck     # TypeScript check
npm run build         # Production build
npm run ci            # Full CI pipeline
```

## ⚡ Performance Benchmark

Based on `scripts/bench.py` simulating 100 concurrent scrape requests via Ace Data Cloud HTTP Proxy API:

| Metric | Result |
|---|---|
| **p50 Latency** | 117.33ms |
| **p95 Latency** | 175.04ms |
| **p99 Latency** | 189.46ms |
| **Proxy Failover Rate** | 0.0% |
| **LLM Extraction Success** | 100.0% |

## 📁 Project Structure

```
proxygen/
├── agent/                    # Node.js autonomous agent
│   ├── src/
│   │   ├── index.ts          # Entry point + Fastify server
│   │   ├── config.ts         # Environment + constants
│   │   ├── types.ts          # Shared TypeScript interfaces
│   │   ├── sources.ts        # 10 curated data sources
│   │   ├── mock.ts           # Demo mode data generators
│   │   ├── orchestrator.ts   # Core pipeline controller
│   │   ├── ace/
│   │   │   ├── proxy.ts      # Ace Data Cloud proxy client
│   │   │   └── llm.ts        # LLM extraction pipeline
│   │   ├── feeds/
│   │   │   ├── store.ts      # In-memory feed cache + TTL
│   │   │   ├── log.ts        # Decision log + payments
│   │   │   └── api.ts        # REST + SSE endpoints
│   │   └── health/
│   │       └── monitor.ts    # Source health + failover
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── tsconfig.json
├── dashboard/                # Next.js 16 Command Center
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # SOC design system
│   │   │   ├── layout.tsx    # Root layout + OG metadata
│   │   │   └── page.tsx      # Dashboard (7 components)
│   │   └── lib/
│   │       └── types.ts      # Dashboard types
│   ├── public/
│   │   └── icon.svg          # Project icon
│   └── .env.example
├── docs/                     # README assets
├── .github/
│   ├── workflows/
│   │   ├── ci.yml            # Dual-workspace CI
│   │   └── codeql.yml        # Security analysis
│   └── dependabot.yml        # Dependency updates
├── .gitignore
├── LICENSE                   # MIT
└── README.md                 # You are here
```

## 📄 License

[MIT](LICENSE) © 2026 Edy Cu

## 🙏 Acknowledgments

Built for the **OOBE × Ace Data Cloud Autonomous Agent Bounty** on Superteam.

Thank you to:
- [OOBE Protocol](https://oobeprotocol.ai) — Synapse Agent Protocol (SAP) and x402 payment rails
- [Ace Data Cloud](https://acedata.cloud) — Proxy infrastructure and AI APIs
- [Superteam](https://superteam.fun) — For hosting and mentorship
