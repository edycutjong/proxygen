// ─── Demo Mode Mock Data ──────────────────────────────────────
// Generates realistic mock data when PROXYGEN_DEMO=true.
// Enables development and demo recording without live API keys.

import { nanoid } from "nanoid";
import type {
  ProxygenFeedItem,
  DecisionLogEntry,
  SourceHealth,
  PaymentRecord,
  AgentStats,
} from "./types.js";
import { DATA_SOURCES } from "./sources.js";

// ─── Helpers ──────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function isoNow(): string {
  return new Date().toISOString();
}

// ─── Mock Generators ──────────────────────────────────────────

/** Generate a mock BTC price for a given source region. */
function mockBtcPrice(region: string): { price: number; currency: string; volume: number } {
  const baseUsd = 62_500 + randomBetween(-500, 500);
  switch (region) {
    case "KR": {
      // Kimchi premium: 2.5-4.0% over USD
      const premium = 1 + randomBetween(0.025, 0.04);
      const krwRate = 1_320 + randomBetween(-10, 10);
      return {
        price: Math.round(baseUsd * krwRate * premium),
        currency: "KRW",
        volume: Math.round(randomBetween(800_000_000_000, 1_500_000_000_000)),
      };
    }
    case "CN":
      return {
        price: Math.round(baseUsd * (7.25 + randomBetween(-0.05, 0.05))),
        currency: "CNY",
        volume: Math.round(randomBetween(5_000_000_000, 15_000_000_000)),
      };
    case "JP":
      return {
        price: Math.round(baseUsd * (155 + randomBetween(-2, 2))),
        currency: "JPY",
        volume: Math.round(randomBetween(200_000_000_000, 500_000_000_000)),
      };
    default:
      return {
        price: Math.round(baseUsd * 100) / 100,
        currency: "USD",
        volume: Math.round(randomBetween(20_000_000_000, 40_000_000_000)),
      };
  }
}

/** Generate a mock sentiment score for sentiment sources. */
function mockSentiment(): { score: number; topic: string; summary: string } {
  const score = randomBetween(-0.3, 0.8);
  const topics = ["bitcoin", "ethereum", "altseason", "regulation", "institutional"];
  const summaries = [
    "Bullish sentiment on BTC breaking new highs",
    "Mixed signals as traders await Fed decision",
    "Strong accumulation phase detected in KR market",
    "Cautious optimism around ETH staking yields",
    "Retail interest surging in APAC region",
  ];
  return {
    score: Math.round(score * 100) / 100,
    topic: randomChoice(topics),
    summary: randomChoice(summaries),
  };
}

/** Generate a mock feed item for a given data source. */
export function generateMockFeedItem(sourceId: string): ProxygenFeedItem {
  const source = DATA_SOURCES.find((s) => s.id === sourceId);
  if (!source) throw new Error(`Unknown source: ${sourceId}`);

  const id = nanoid(12);
  const proxyRegion = `${source.region}-${source.proxy_type}`;
  const cost = source.geo_restricted ? randomBetween(0.04, 0.08) : randomBetween(0.01, 0.03);

  if (source.data_type === "sentiment") {
    const sentiment = mockSentiment();
    return {
      id,
      source: source.id,
      region: source.region,
      type: "sentiment",
      data: {
        sentiment_score: sentiment.score,
        raw_text: sentiment.summary,
      },
      confidence: randomBetween(0.7, 0.95),
      proxy_region: proxyRegion,
      cost_usdc: Math.round(cost * 1000) / 1000,
      timestamp: isoNow(),
      x402_tx: `mock_${nanoid(8)}`,
    };
  }

  const priceData = mockBtcPrice(source.region);
  return {
    id,
    source: source.id,
    region: source.region,
    type: "price",
    data: {
      symbol: `BTC/${priceData.currency}`,
      price: priceData.price,
      volume_24h: priceData.volume,
    },
    confidence: randomBetween(0.85, 0.99),
    proxy_region: proxyRegion,
    cost_usdc: Math.round(cost * 1000) / 1000,
    timestamp: isoNow(),
    x402_tx: `mock_${nanoid(8)}`,
  };
}

/** Generate mock decision log entries for a scrape cycle. */
export function generateMockDecisionLog(sourceId: string): DecisionLogEntry[] {
  const source = DATA_SOURCES.find((s) => s.id === sourceId);
  if (!source) return [];

  const now = Date.now();
  return [
    {
      id: nanoid(8),
      timestamp: new Date(now).toISOString(),
      type: "discovery",
      message: `SAP discovery: selected ${source.region}-${source.proxy_type} proxy for ${source.name}`,
    },
    {
      id: nanoid(8),
      timestamp: new Date(now + 200).toISOString(),
      type: "scrape",
      message: `Scraping ${source.name} (${source.url.slice(0, 50)}...)`,
    },
    {
      id: nanoid(8),
      timestamp: new Date(now + 1500).toISOString(),
      type: "payment",
      message: `x402 payment: ${source.geo_restricted ? "0.05" : "0.02"} USDC for proxy access`,
      metadata: { service: "proxy", region: source.region },
    },
    {
      id: nanoid(8),
      timestamp: new Date(now + 2000).toISOString(),
      type: "extract",
      message: `LLM extraction complete: confidence 0.${Math.floor(randomBetween(85, 99))}`,
    },
    {
      id: nanoid(8),
      timestamp: new Date(now + 2200).toISOString(),
      type: "payment",
      message: `x402 payment: 0.02 USDC for GPT-4o extraction`,
      metadata: { service: "llm", model: "gpt-4o-mini" },
    },
    {
      id: nanoid(8),
      timestamp: new Date(now + 2400).toISOString(),
      type: "publish",
      message: `Feed updated: ${source.id} → cache (TTL 3600s)`,
    },
  ];
}

/** Generate mock source health for all sources. */
export function generateMockSourceHealth(): SourceHealth[] {
  return DATA_SOURCES.filter((s) => s.enabled).map((source) => ({
    source_id: source.id,
    status: Math.random() > 0.1 ? "healthy" : Math.random() > 0.5 ? "degraded" : "down",
    last_scrape: isoNow(),
    last_error: null,
    success_rate: randomBetween(0.85, 1.0),
    avg_latency_ms: source.geo_restricted
      ? Math.round(randomBetween(800, 2500))
      : Math.round(randomBetween(200, 800)),
    consecutive_failures: 0,
  }));
}

/** Generate mock payment records. */
export function generateMockPayments(count: number): PaymentRecord[] {
  const payments: PaymentRecord[] = [];
  const services = ["proxy-kr", "proxy-us", "proxy-cn", "llm-gpt4o", "llm-deepseek", "feed-query"];

  for (let i = 0; i < count; i++) {
    const isInflow = Math.random() > 0.7;
    payments.push({
      id: nanoid(8),
      timestamp: new Date(Date.now() - i * 120_000).toISOString(),
      direction: isInflow ? "inflow" : "outflow",
      amount_usdc: isInflow
        ? randomBetween(0.005, 0.02)
        : randomBetween(0.01, 0.08),
      service: randomChoice(services),
      tx_hash: `mock_${nanoid(12)}`,
      status: "settled",
    });
  }
  return payments;
}

/** Generate mock agent stats. */
export function generateMockStats(): AgentStats {
  const healthData = generateMockSourceHealth();
  return {
    is_active: true,
    uptime_seconds: Math.floor(randomBetween(3600, 86400)),
    total_scrapes: Math.floor(randomBetween(100, 500)),
    total_extractions: Math.floor(randomBetween(80, 450)),
    total_feed_queries: Math.floor(randomBetween(20, 200)),
    total_x402_outflow_usdc: Math.round(randomBetween(2, 8) * 100) / 100,
    total_x402_inflow_usdc: Math.round(randomBetween(1, 5) * 100) / 100,
    sources_healthy: healthData.filter((h) => h.status === "healthy").length,
    sources_degraded: healthData.filter((h) => h.status === "degraded").length,
    sources_down: healthData.filter((h) => h.status === "down").length,
    feed_items_cached: Math.floor(randomBetween(30, 150)),
    last_cycle_at: isoNow(),
    wallet_balance_usdc: Math.round(randomBetween(8, 15) * 100) / 100,
  };
}
