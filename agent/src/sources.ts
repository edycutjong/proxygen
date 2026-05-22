// ─── Proxygen Data Sources ────────────────────────────────────
// 10 curated data sources engineered for the kimchi premium demo.

import type { DataSource } from "./types.js";

/**
 * Extraction prompt template.
 * The LLM receives raw text + this system prompt and returns structured JSON.
 */
const PRICE_EXTRACTION_PROMPT = `You are a financial data extraction engine. Extract cryptocurrency market data from the raw text below.

Return ONLY a JSON object with these fields (omit any you cannot determine):
{
  "symbol": "BTC/KRW",          // trading pair
  "price": 85000000,            // current price in local currency
  "volume_24h": 1200000000000,  // 24h volume in local currency
  "change_24h_pct": 2.3,        // 24h change percentage
  "bid": 84990000,              // best bid
  "ask": 85010000,              // best ask
  "currency": "KRW"             // local currency code
}

Be precise with numbers. Do NOT use commas in numbers. Convert Korean/Chinese number notation to integers.`;

const SENTIMENT_EXTRACTION_PROMPT = `You are a sentiment analysis engine for cryptocurrency markets. Analyze the raw text and extract market sentiment.

Return ONLY a JSON object:
{
  "sentiment_score": 0.7,       // -1.0 (very bearish) to 1.0 (very bullish)
  "dominant_topic": "bitcoin",  // main topic
  "key_phrases": ["rally", "all-time high"],
  "language": "ko",             // detected language
  "summary": "Korean traders are bullish on BTC breaking 85M KRW"
}`;

export const DATA_SOURCES: DataSource[] = [
  // ─── Korean Exchanges (Geo-Restricted) ───
  {
    id: "upbit-kr",
    name: "Upbit",
    url: "https://api.upbit.com/v1/ticker?markets=KRW-BTC",
    region: "KR",
    proxy_type: "residential",
    geo_restricted: true,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000, // 10 min
    enabled: true,
  },
  {
    id: "bithumb-kr",
    name: "Bithumb",
    url: "https://api.bithumb.com/public/ticker/BTC_KRW",
    region: "KR",
    proxy_type: "residential",
    geo_restricted: true,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },

  // ─── Chinese Sentiment (Geo-Restricted) ───
  {
    id: "huobi-cn",
    name: "Huobi Global",
    url: "https://api.huobi.pro/market/detail/merged?symbol=btcusdt",
    region: "CN",
    proxy_type: "mobile",
    geo_restricted: true,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },

  // ─── Global Benchmarks ───
  {
    id: "coingecko-global",
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,krw&include_24hr_vol=true&include_24hr_change=true",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },
  {
    id: "coinbase-us",
    name: "Coinbase",
    url: "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },
  {
    id: "binance-global",
    name: "Binance",
    url: "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },

  // ─── Sentiment Sources ───
  {
    id: "naver-kr",
    name: "Naver Finance",
    url: "https://finance.naver.com/crypto/",
    region: "KR",
    proxy_type: "residential",
    geo_restricted: true,
    data_type: "sentiment",
    extraction_prompt: SENTIMENT_EXTRACTION_PROMPT,
    scrape_interval_ms: 1_800_000, // 30 min
    enabled: true,
  },
  {
    id: "coinpost-jp",
    name: "CoinPost JP",
    url: "https://coinpost.jp/",
    region: "JP",
    proxy_type: "residential",
    geo_restricted: false,
    data_type: "sentiment",
    extraction_prompt: SENTIMENT_EXTRACTION_PROMPT,
    scrape_interval_ms: 1_800_000,
    enabled: true,
  },

  // ─── Additional Price Sources ───
  {
    id: "okx-global",
    name: "OKX",
    url: "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },
  {
    id: "bybit-global",
    name: "Bybit",
    url: "https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: PRICE_EXTRACTION_PROMPT,
    scrape_interval_ms: 600_000,
    enabled: true,
  },
];
