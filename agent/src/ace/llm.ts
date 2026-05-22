// ─── Ace Data Cloud LLM Extraction ────────────────────────────
// Extracts structured data from raw HTML/JSON using GPT-4o via
// Ace Data Cloud's OpenAI-compatible API with x402 payments.

import { DEMO_MODE, LLM_CONFIG, log } from "../config.js";
import type { DataSource, ProxygenFeedItem } from "../types.js";
import { nanoid } from "nanoid";

/** Result of an LLM extraction. */
export interface ExtractionResult {
  feed_item: ProxygenFeedItem;
  model_used: string;
  latency_ms: number;
  cost_usdc: number;
  x402_tx?: string;
}

/**
 * Extract structured data from raw text using Ace Data Cloud's LLM API.
 * In demo mode, uses simple JSON parsing / regex extraction.
 */
export async function extractWithLLM(
  source: DataSource,
  rawText: string,
  proxyRegion: string,
  proxyCost: number,
  _aceClient?: unknown,
): Promise<ExtractionResult> {
  const startTime = Date.now();

  if (DEMO_MODE) {
    return extractDemoMode(source, rawText, proxyRegion, proxyCost);
  }

  // ─── Live Mode ───
  // For sources with JSON API responses, try direct parsing first
  try {
    const parsed = JSON.parse(rawText);
    const extracted = extractFromJson(source, parsed);
    if (extracted) {
      const feedItem: ProxygenFeedItem = {
        id: nanoid(12),
        source: source.id,
        region: source.region,
        type: source.data_type,
        data: extracted,
        confidence: 0.95, // High confidence for direct JSON parsing
        proxy_region: proxyRegion,
        cost_usdc: proxyCost, // No LLM cost for JSON parsing
        timestamp: new Date().toISOString(),
      };
      return {
        feed_item: feedItem,
        model_used: "json-parser",
        latency_ms: Date.now() - startTime,
        cost_usdc: 0,
      };
    }
  } catch {
    // Not JSON — will use LLM
  }

  // TODO: Wire up @acedatacloud/sdk chat.completions with x402 payment
  // For now, fall back to demo extraction
  log("warn", `Live LLM extraction not yet wired — using demo mode for ${source.id}`);
  return extractDemoMode(source, rawText, proxyRegion, proxyCost);
}

/** Demo mode extraction using JSON parsing and mock confidence. */
function extractDemoMode(
  source: DataSource,
  rawText: string,
  proxyRegion: string,
  proxyCost: number,
): ExtractionResult {
  let data: ProxygenFeedItem["data"] = {};
  let confidence = 0.9;

  try {
    const parsed = JSON.parse(rawText);
    const extracted = extractFromJson(source, parsed);
    if (extracted) {
      data = extracted;
      confidence = 0.95;
    }
  } catch {
    // HTML content — use regex extraction for demo
    data = extractFromHtml(source, rawText);
    confidence = 0.78;
  }

  const llmCost = 0.02;
  const feedItem: ProxygenFeedItem = {
    id: nanoid(12),
    source: source.id,
    region: source.region,
    type: source.data_type,
    data,
    confidence: Math.round(confidence * 100) / 100,
    proxy_region: proxyRegion,
    cost_usdc: Math.round((proxyCost + llmCost) * 1000) / 1000,
    timestamp: new Date().toISOString(),
    x402_tx: `mock_llm_${Date.now().toString(36)}`,
  };

  return {
    feed_item: feedItem,
    model_used: LLM_CONFIG.primary_model,
    latency_ms: Math.round(400 + Math.random() * 800),
    cost_usdc: llmCost,
    x402_tx: `mock_llm_${Date.now().toString(36)}`,
  };
}

/** Extract data from JSON API responses based on known source formats. */
function extractFromJson(
  source: DataSource,
  data: unknown,
): ProxygenFeedItem["data"] | null {
  const obj = data as Record<string, unknown>;

  switch (source.id) {
    case "upbit-kr": {
      const arr = data as Array<Record<string, unknown>>;
      const tick = arr?.[0];
      if (!tick) return null;
      return {
        symbol: "BTC/KRW",
        price: Number(tick.trade_price),
        volume_24h: Number(tick.acc_trade_price_24h),
      };
    }
    case "bithumb-kr": {
      const d = (obj.data as Record<string, unknown>) ?? {};
      return {
        symbol: "BTC/KRW",
        price: Number(d.closing_price),
        volume_24h: Number(d.acc_trade_value_24H),
      };
    }
    case "huobi-cn": {
      const tick = (obj.tick as Record<string, unknown>) ?? {};
      return {
        symbol: "BTC/USDT",
        price: Number(tick.close),
        volume_24h: Number(tick.amount),
      };
    }
    case "coingecko-global": {
      const btc = (obj.bitcoin as Record<string, unknown>) ?? {};
      return {
        symbol: "BTC/USD",
        price: Number(btc.usd),
        volume_24h: Number(btc.usd_24h_vol),
      };
    }
    case "coinbase-us": {
      const d = (obj.data as Record<string, unknown>) ?? {};
      const rates = (d.rates as Record<string, unknown>) ?? {};
      return {
        symbol: "BTC/USD",
        price: Number(rates.USD),
      };
    }
    case "binance-global": {
      return {
        symbol: "BTC/USDT",
        price: Number(obj.lastPrice),
        volume_24h: Number(obj.quoteVolume),
      };
    }
    case "okx-global": {
      const items = (obj.data as Array<Record<string, unknown>>) ?? [];
      const tick = items[0];
      if (!tick) return null;
      return {
        symbol: "BTC/USDT",
        price: Number(tick.last),
        volume_24h: Number(tick.volCcy24h),
      };
    }
    case "bybit-global": {
      const result = (obj.result as Record<string, unknown>) ?? {};
      const list = (result.list as Array<Record<string, unknown>>) ?? [];
      const tick = list[0];
      if (!tick) return null;
      return {
        symbol: "BTC/USDT",
        price: Number(tick.lastPrice),
        volume_24h: Number(tick.turnover24h),
      };
    }
    default:
      return null;
  }
}

/** Extract data from HTML using simple patterns (for sentiment sources). */
function extractFromHtml(
  source: DataSource,
  html: string,
): ProxygenFeedItem["data"] {
  // Simple sentiment extraction from Korean/Japanese HTML
  const bullishPatterns = /활발|상승|돌파|급증|突破|加速|bullish|rally/i;
  const bearishPatterns = /하락|냉각|급락|暴落|下落|bearish|crash/i;

  let sentimentScore = 0;
  if (bullishPatterns.test(html)) sentimentScore += 0.5;
  if (bearishPatterns.test(html)) sentimentScore -= 0.5;
  if (sentimentScore === 0) sentimentScore = 0.1; // neutral-positive default

  return {
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    raw_text: html.replace(/<[^>]+>/g, "").trim().slice(0, 200),
  };
}
