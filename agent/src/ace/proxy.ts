// ─── Ace Data Cloud Proxy Client ──────────────────────────────
// Wraps Ace Data Cloud's HTTP proxy API for geo-restricted scraping.
// In demo mode, returns mock scraped HTML.

import { DEMO_MODE, log } from "../config.js";
import type { DataSource } from "../types.js";

/** Result of a proxy scrape operation. */
export interface ScrapeResult {
  raw_text: string;
  status_code: number;
  latency_ms: number;
  proxy_region: string;
  cost_usdc: number;
  x402_tx?: string;
}

// ─── Mock HTML responses for demo mode ────────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  "upbit-kr": JSON.stringify([{
    market: "KRW-BTC",
    trade_price: 85_230_000,
    acc_trade_volume_24h: 3241.5,
    acc_trade_price_24h: 1_234_567_890_000,
    signed_change_rate: 0.023,
    timestamp: Date.now(),
  }]),
  "bithumb-kr": JSON.stringify({
    status: "0000",
    data: {
      closing_price: "84950000",
      acc_trade_value_24H: "987654321000",
      fluctate_rate_24H: "1.8",
    },
  }),
  "huobi-cn": JSON.stringify({
    status: "ok",
    tick: {
      close: 62480.52,
      vol: 12345.67,
      amount: 770_000_000,
    },
  }),
  "coingecko-global": JSON.stringify({
    bitcoin: {
      usd: 62500,
      krw: 82500000,
      usd_24h_vol: 28_000_000_000,
      usd_24h_change: 2.1,
    },
  }),
  "coinbase-us": JSON.stringify({
    data: {
      currency: "BTC",
      rates: { USD: "62512.34", KRW: "82500000" },
    },
  }),
  "binance-global": JSON.stringify({
    symbol: "BTCUSDT",
    lastPrice: "62495.30",
    volume: "42156.789",
    quoteVolume: "2634567890.12",
    priceChangePercent: "1.95",
  }),
  "naver-kr": `<html><body><div class="crypto_price">비트코인 8,523만원 돌파, 거래량 급증 24시간 1.2조원. 시장 분위기 활발.</div></body></html>`,
  "coinpost-jp": `<html><body><article>ビットコイン価格が968万円を突破。機関投資家の参入が加速。</article></body></html>`,
  "okx-global": JSON.stringify({
    code: "0",
    data: [{
      instId: "BTC-USDT",
      last: "62510.5",
      vol24h: "15234.56",
      volCcy24h: "952345678.90",
    }],
  }),
  "bybit-global": JSON.stringify({
    result: {
      list: [{
        symbol: "BTCUSDT",
        lastPrice: "62505.00",
        volume24h: "18234.56",
        turnover24h: "1140000000.00",
      }],
    },
  }),
};

/**
 * Scrape a data source via Ace Data Cloud's proxy API.
 * In demo mode, returns mock data without making any API calls.
 */
export async function scrapeViaProxy(
  source: DataSource,
  _aceClient?: unknown,
): Promise<ScrapeResult> {
  const startTime = Date.now();

  if (DEMO_MODE) {
    // Simulate network latency
    const mockLatency = source.geo_restricted
      ? 800 + Math.random() * 1500
      : 200 + Math.random() * 500;
    await new Promise((r) => setTimeout(r, Math.min(mockLatency, 500))); // Cap at 500ms for demo speed

    const mockText = MOCK_RESPONSES[source.id] ?? `{"mock": true, "source": "${source.id}"}`;
    const cost = source.geo_restricted ? 0.05 : 0.02;

    return {
      raw_text: mockText,
      status_code: 200,
      latency_ms: Math.round(mockLatency),
      proxy_region: `${source.region}-${source.proxy_type}`,
      cost_usdc: cost,
      x402_tx: `mock_proxy_${Date.now().toString(36)}`,
    };
  }

  // ─── Live Mode ───
  try {
    // For non-geo-restricted sources, we can fetch directly
    if (!source.geo_restricted) {
      const resp = await fetch(source.url, {
        headers: { "User-Agent": "Proxygen/0.1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      const text = await resp.text();
      return {
        raw_text: text,
        status_code: resp.status,
        latency_ms: Date.now() - startTime,
        proxy_region: `${source.region}-direct`,
        cost_usdc: 0,
      };
    }

    // For geo-restricted sources, use Ace Data Cloud proxy
    // TODO: Wire up @acedatacloud/sdk proxy API when endpoint is confirmed
    log("warn", `Live proxy scraping not yet wired for ${source.id} — falling back to mock`);
    const mockText = MOCK_RESPONSES[source.id] ?? `{"error": "proxy not configured"}`;
    return {
      raw_text: mockText,
      status_code: 200,
      latency_ms: Date.now() - startTime,
      proxy_region: `${source.region}-${source.proxy_type}`,
      cost_usdc: 0.05,
      x402_tx: `pending_${Date.now().toString(36)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", `Scrape failed for ${source.id}: ${message}`);
    throw err;
  }
}
