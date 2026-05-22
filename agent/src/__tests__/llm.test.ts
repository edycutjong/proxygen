import { jest } from "@jest/globals";
import type { DataSource } from "../types.js";

import { updateDemoMode } from "../config.js";
import { extractWithLLM } from "../ace/llm.js";

describe("extractWithLLM", () => {
  const priceSource = (id: string, region = "US"): DataSource => ({
    id,
    name: "Test Price",
    url: "http://api.test",
    region,
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: "prompt",
    scrape_interval_ms: 600000,
    enabled: true,
  });

  const sentimentSource = (id: string, region = "KR"): DataSource => ({
    id,
    name: "Test Sentiment",
    url: "http://api.test",
    region,
    proxy_type: "residential",
    geo_restricted: true,
    data_type: "sentiment",
    extraction_prompt: "prompt",
    scrape_interval_ms: 600000,
    enabled: true,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when DEMO_MODE is true", () => {
    beforeAll(() => {
      process.env.PROXYGEN_DEMO = "true";
      updateDemoMode();
    });

    it("should extract from JSON for Upbit", async () => {
      const rawText = JSON.stringify([{ trade_price: 85000000, acc_trade_price_24h: 1200000000 }]);
      const res = await extractWithLLM(priceSource("upbit-kr", "KR"), rawText, "KR-residential", 0.05);
      expect(res.feed_item.data.price).toBe(85000000);
      expect(res.feed_item.data.volume_24h).toBe(1200000000);
      expect(res.feed_item.confidence).toBe(0.95);
      expect(res.cost_usdc).toBe(0.02);
    });

    it("should extract from JSON for Bithumb", async () => {
      const rawText = JSON.stringify({ data: { closing_price: "84950000", acc_trade_value_24H: "987654321000" } });
      const res = await extractWithLLM(priceSource("bithumb-kr", "KR"), rawText, "KR-residential", 0.05);
      expect(res.feed_item.data.price).toBe(84950000);
      expect(res.feed_item.data.volume_24h).toBe(987654321000);
    });

    it("should extract from JSON for Huobi", async () => {
      const rawText = JSON.stringify({ tick: { close: 62480.52, amount: 770000000 } });
      const res = await extractWithLLM(priceSource("huobi-cn", "CN"), rawText, "CN-mobile", 0.08);
      expect(res.feed_item.data.price).toBe(62480.52);
      expect(res.feed_item.data.volume_24h).toBe(770000000);
    });

    it("should extract from JSON for CoinGecko", async () => {
      const rawText = JSON.stringify({ bitcoin: { usd: 62500, usd_24h_vol: 28000000000 } });
      const res = await extractWithLLM(priceSource("coingecko-global"), rawText, "US-direct", 0);
      expect(res.feed_item.data.price).toBe(62500);
      expect(res.feed_item.data.volume_24h).toBe(28000000000);
    });

    it("should extract from JSON for Coinbase", async () => {
      const rawText = JSON.stringify({ data: { rates: { USD: "62512.34" } } });
      const res = await extractWithLLM(priceSource("coinbase-us"), rawText, "US-direct", 0);
      expect(res.feed_item.data.price).toBe(62512.34);
    });

    it("should extract from JSON for Binance", async () => {
      const rawText = JSON.stringify({ lastPrice: "62495.30", quoteVolume: "2634567890.12" });
      const res = await extractWithLLM(priceSource("binance-global"), rawText, "US-direct", 0);
      expect(res.feed_item.data.price).toBe(62495.3);
      expect(res.feed_item.data.volume_24h).toBe(2634567890.12);
    });

    it("should extract from JSON for OKX", async () => {
      const rawText = JSON.stringify({ data: [{ last: "62510.5", volCcy24h: "952345678.90" }] });
      const res = await extractWithLLM(priceSource("okx-global"), rawText, "US-direct", 0);
      expect(res.feed_item.data.price).toBe(62510.5);
      expect(res.feed_item.data.volume_24h).toBe(952345678.9);
    });

    it("should extract from JSON for Bybit", async () => {
      const rawText = JSON.stringify({ result: { list: [{ lastPrice: "62505.00", turnover24h: "1140000000.00" }] } });
      const res = await extractWithLLM(priceSource("bybit-global"), rawText, "US-direct", 0);
      expect(res.feed_item.data.price).toBe(62505);
      expect(res.feed_item.data.volume_24h).toBe(1140000000);
    });

    it("should fallback to empty data for unknown price source JSON", async () => {
      const rawText = JSON.stringify({ price: 100 });
      const res = await extractWithLLM(priceSource("unknown-src"), rawText, "US-direct", 0);
      expect(res.feed_item.data).toEqual({});
    });

    it("should return empty data when JSON response contains empty lists/ticks for Upbit, OKX, Bybit", async () => {
      const emptyArrayText = JSON.stringify([]);
      const upbitRes = await extractWithLLM(priceSource("upbit-kr", "KR"), emptyArrayText, "KR-residential", 0.05);
      expect(upbitRes.feed_item.data).toEqual({});

      const okxRes = await extractWithLLM(priceSource("okx-global"), JSON.stringify({ data: [] }), "US-direct", 0);
      expect(okxRes.feed_item.data).toEqual({});

      const bybitRes = await extractWithLLM(priceSource("bybit-global"), JSON.stringify({ result: { list: [] } }), "US-direct", 0);
      expect(bybitRes.feed_item.data).toEqual({});
    });

    it("should cover nullish coalescing fallbacks for direct JSON parsing", async () => {
      // bithumb-kr null data
      const bithumbRes = await extractWithLLM(priceSource("bithumb-kr", "KR"), JSON.stringify({ data: null }), "KR-residential", 0.05);
      expect(bithumbRes.feed_item.data.price).toBeNaN();

      // huobi-cn null tick
      const huobiRes = await extractWithLLM(priceSource("huobi-cn", "CN"), JSON.stringify({ tick: null }), "CN-mobile", 0.08);
      expect(huobiRes.feed_item.data.price).toBeNaN();

      // coingecko-global null bitcoin
      const coingeckoRes = await extractWithLLM(priceSource("coingecko-global"), JSON.stringify({ bitcoin: null }), "US-direct", 0);
      expect(coingeckoRes.feed_item.data.price).toBeNaN();

      // coinbase-us null data or rates
      const coinbaseRes = await extractWithLLM(priceSource("coinbase-us"), JSON.stringify({ data: null }), "US-direct", 0);
      expect(coinbaseRes.feed_item.data.price).toBeNaN();

      const coinbaseRes2 = await extractWithLLM(priceSource("coinbase-us"), JSON.stringify({ data: { rates: null } }), "US-direct", 0);
      expect(coinbaseRes2.feed_item.data.price).toBeNaN();

      // okx-global null data
      const okxRes = await extractWithLLM(priceSource("okx-global"), JSON.stringify({ data: null }), "US-direct", 0);
      expect(okxRes.feed_item.data).toEqual({});

      // bybit-global null result or list
      const bybitRes = await extractWithLLM(priceSource("bybit-global"), JSON.stringify({ result: null }), "US-direct", 0);
      expect(bybitRes.feed_item.data).toEqual({});

      const bybitRes2 = await extractWithLLM(priceSource("bybit-global"), JSON.stringify({ result: { list: null } }), "US-direct", 0);
      expect(bybitRes2.feed_item.data).toEqual({});
    });

    it("should parse HTML using regex for Naver (bullish patterns)", async () => {
      const htmlText = "비트코인 상승 돌파 급증";
      const res = await extractWithLLM(sentimentSource("naver-kr"), htmlText, "KR-residential", 0.05);
      expect(res.feed_item.data.sentiment_score).toBe(0.5);
      expect(res.feed_item.confidence).toBe(0.78);
    });

    it("should parse HTML using regex for CoinPost (bearish patterns)", async () => {
      const htmlText = "ビットコイン価格が暴落下落";
      const res = await extractWithLLM(sentimentSource("coinpost-jp", "JP"), htmlText, "JP-direct", 0);
      expect(res.feed_item.data.sentiment_score).toBe(-0.5);
    });

    it("should parse HTML using regex and assign default score if neutral", async () => {
      const htmlText = "ordinary page content without key sentiment triggers";
      const res = await extractWithLLM(sentimentSource("naver-kr"), htmlText, "KR-residential", 0.05);
      expect(res.feed_item.data.sentiment_score).toBe(0.1);
    });
  });

  describe("when DEMO_MODE is false", () => {
    beforeAll(() => {
      process.env.PROXYGEN_DEMO = "false";
      updateDemoMode();
    });

    it("should parse valid JSON directly with json-parser without LLM cost", async () => {
      const rawText = JSON.stringify([{ trade_price: 85000000, acc_trade_price_24h: 1200000000 }]);
      const res = await extractWithLLM(priceSource("upbit-kr", "KR"), rawText, "KR-residential", 0.05);
      expect(res.model_used).toBe("json-parser");
      expect(res.cost_usdc).toBe(0);
      expect(res.feed_item.data.price).toBe(85000000);
    });

    it("should fallback to extractDemoMode and warn on HTML / non-JSON responses", async () => {
      const htmlText = "비트코인 상승 돌파 급증";
      const res = await extractWithLLM(sentimentSource("naver-kr"), htmlText, "KR-residential", 0.05);
      // Fallback model used is primary_model (which is "gpt-4o-mini" by default)
      expect(res.model_used).toBe("gpt-4o-mini");
      expect(res.cost_usdc).toBe(0.02);
      expect(res.feed_item.data.sentiment_score).toBe(0.5);
    });
  });
});
