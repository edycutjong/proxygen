import {
  generateMockFeedItem,
  generateMockDecisionLog,
  generateMockSourceHealth,
  generateMockPayments,
  generateMockStats,
} from "../mock.js";
import { DATA_SOURCES } from "../sources.js";

describe("mock", () => {
  describe("generateMockFeedItem", () => {
    it("should generate a feed item for price data source (e.g., upbit-kr)", () => {
      const item = generateMockFeedItem("upbit-kr");
      expect(item.source).toBe("upbit-kr");
      expect(item.region).toBe("KR");
      expect(item.type).toBe("price");
      expect(item.data.symbol).toBe("BTC/KRW");
      expect(typeof item.data.price).toBe("number");
      expect(typeof item.data.volume_24h).toBe("number");
      expect(typeof item.confidence).toBe("number");
      expect(item.proxy_region).toBe("KR-residential");
      expect(item.x402_tx).toContain("mock_");
    });

    it("should generate a feed item for sentiment data source (e.g., naver-kr)", () => {
      const item = generateMockFeedItem("naver-kr");
      expect(item.source).toBe("naver-kr");
      expect(item.region).toBe("KR");
      expect(item.type).toBe("sentiment");
      expect(typeof item.data.sentiment_score).toBe("number");
      expect(typeof item.data.raw_text).toBe("string");
      expect(item.proxy_region).toBe("KR-residential");
    });

    it("should generate mock prices for other regions", () => {
      const cnItem = generateMockFeedItem("huobi-cn");
      expect(cnItem.data.symbol).toBe("BTC/CNY");

      const jpItem = generateMockFeedItem("coinpost-jp");
      expect(jpItem.type).toBe("sentiment"); // coinpost is sentiment

      // Add a temporary JP price source to test Case "JP"
      (DATA_SOURCES as any).push({
        id: "mock-jp-price",
        name: "Mock JP Price",
        url: "http://example.jp",
        region: "JP",
        proxy_type: "residential",
        geo_restricted: true,
        data_type: "price",
        extraction_prompt: "",
        scrape_interval_ms: 1000,
        enabled: true,
      });

      try {
        const jpPriceItem = generateMockFeedItem("mock-jp-price");
        expect(jpPriceItem.data.symbol).toBe("BTC/JPY");
        expect(jpPriceItem.data.price).toBeDefined();
      } finally {
        (DATA_SOURCES as any).pop();
      }

      const okxItem = generateMockFeedItem("okx-global");
      expect(okxItem.data.symbol).toBe("BTC/USD");
    });

    it("should throw error on unknown source ID", () => {
      expect(() => generateMockFeedItem("unknown-source")).toThrow("Unknown source: unknown-source");
    });
  });

  describe("generateMockDecisionLog", () => {
    it("should generate decision log entries for valid source", () => {
      const entries = generateMockDecisionLog("upbit-kr");
      expect(entries.length).toBe(6);
      expect(entries[0]?.type).toBe("discovery");
      expect(entries[1]?.type).toBe("scrape");
      expect(entries[2]?.type).toBe("payment");
      expect(entries[2]?.message).toContain("0.05 USDC");
      expect(entries[3]?.type).toBe("extract");
      expect(entries[4]?.type).toBe("payment");
      expect(entries[5]?.type).toBe("publish");
    });

    it("should generate decision log entries with 0.02 USDC payment for non-geo-restricted source", () => {
      const entries = generateMockDecisionLog("coinbase-us");
      expect(entries.length).toBe(6);
      expect(entries[2]?.type).toBe("payment");
      expect(entries[2]?.message).toContain("0.02 USDC");
    });

    it("should return empty array for unknown source", () => {
      const entries = generateMockDecisionLog("unknown-source");
      expect(entries).toEqual([]);
    });
  });

  describe("generateMockSourceHealth", () => {
    it("should return health for all enabled sources and cover all status branches", () => {
      const originalRandom = Math.random;
      const mockValues: number[] = [];
      Math.random = () => mockValues.shift() ?? 0.5;

      try {
        // Test case 1: healthy (Math.random() > 0.1)
        mockValues.push(0.2);
        const health1 = generateMockSourceHealth();
        expect(health1[0]?.status).toBe("healthy");

        // Test case 2: degraded (Math.random() <= 0.1, then Math.random() > 0.5)
        mockValues.push(0.05, 0.6);
        const health2 = generateMockSourceHealth();
        expect(health2[0]?.status).toBe("degraded");

        // Test case 3: down (Math.random() <= 0.1, then Math.random() <= 0.5)
        mockValues.push(0.05, 0.3);
        const health3 = generateMockSourceHealth();
        expect(health3[0]?.status).toBe("down");

        // General validation
        const health = generateMockSourceHealth();
        const enabledCount = DATA_SOURCES.filter((s) => s.enabled).length;
        expect(health.length).toBe(enabledCount);
        for (const h of health) {
          expect(h).toHaveProperty("source_id");
          expect(["healthy", "degraded", "down"]).toContain(h.status);
          expect(typeof h.avg_latency_ms).toBe("number");
        }
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe("generateMockPayments", () => {
    it("should generate correct number of payment records, covering both inflow and outflow", () => {
      const originalRandom = Math.random;
      let randomCallCount = 0;
      // Alternate Math.random() to return > 0.7 and <= 0.7
      Math.random = () => {
        randomCallCount++;
        return randomCallCount % 2 === 0 ? 0.8 : 0.5;
      };

      try {
        const count = 10;
        const payments = generateMockPayments(count);
        expect(payments.length).toBe(count);
        
        const directions = payments.map(p => p.direction);
        expect(directions).toContain("inflow");
        expect(directions).toContain("outflow");
        
        for (const p of payments) {
          expect(typeof p.amount_usdc).toBe("number");
          expect(p.status).toBe("settled");
        }
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe("generateMockStats", () => {
    it("should return realistic agent stats", () => {
      const stats = generateMockStats();
      expect(stats.is_active).toBe(true);
      expect(typeof stats.uptime_seconds).toBe("number");
      expect(typeof stats.total_scrapes).toBe("number");
      expect(typeof stats.wallet_balance_usdc).toBe("number");
    });
  });
});
