import { jest } from "@jest/globals";
import type { DataSource } from "../types.js";

import { updateDemoMode } from "../config.js";
import { scrapeViaProxy } from "../ace/proxy.js";

describe("scrapeViaProxy", () => {
  const mockPriceSource: DataSource = {
    id: "upbit-kr",
    name: "Upbit",
    url: "https://api.upbit.com/v1/ticker?markets=KRW-BTC",
    region: "KR",
    proxy_type: "residential",
    geo_restricted: true,
    data_type: "price",
    extraction_prompt: "prompt",
    scrape_interval_ms: 600000,
    enabled: true,
  };

  const mockNonGeoSource: DataSource = {
    id: "coingecko-global",
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/simple/price",
    region: "US",
    proxy_type: "datacenter",
    geo_restricted: false,
    data_type: "price",
    extraction_prompt: "prompt",
    scrape_interval_ms: 600000,
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when DEMO_MODE is true", () => {
    beforeAll(() => {
      process.env.PROXYGEN_DEMO = "true";
      updateDemoMode();
    });

    it("should return mock price data for Korean source", async () => {
      const res = await scrapeViaProxy(mockPriceSource);
      expect(res.status_code).toBe(200);
      expect(res.proxy_region).toBe("KR-residential");
      expect(res.cost_usdc).toBe(0.05);
      expect(res.x402_tx).toContain("mock_proxy_");
      expect(JSON.parse(res.raw_text)[0]?.market).toBe("KRW-BTC");
    });

    it("should return mock price data for non-geo-restricted source", async () => {
      const res = await scrapeViaProxy(mockNonGeoSource);
      expect(res.status_code).toBe(200);
      expect(res.proxy_region).toBe("US-datacenter");
      expect(res.cost_usdc).toBe(0.02);
    });

    it("should return default mock response for unknown ID", async () => {
      const unknownSource = { ...mockPriceSource, id: "unknown-id" };
      const res = await scrapeViaProxy(unknownSource);
      expect(res.status_code).toBe(200);
      expect(JSON.parse(res.raw_text)).toEqual({ mock: true, source: "unknown-id" });
    });
  });

  describe("when DEMO_MODE is false", () => {
    let originalFetch: typeof fetch;

    beforeAll(() => {
      process.env.PROXYGEN_DEMO = "false";
      updateDemoMode();
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it("should fetch directly for non-geo-restricted sources", async () => {
      const mockResponseText = JSON.stringify({ price: 62000 });
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve(mockResponseText),
        } as Response)
      ) as any;

      const res = await scrapeViaProxy(mockNonGeoSource);
      expect(res.status_code).toBe(200);
      expect(res.raw_text).toBe(mockResponseText);
      expect(res.proxy_region).toBe("US-direct");
      expect(res.cost_usdc).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(mockNonGeoSource.url, expect.any(Object));
    });

    it("should fallback to mock and log warning for geo-restricted sources", async () => {
      const res = await scrapeViaProxy(mockPriceSource);
      expect(res.status_code).toBe(200);
      expect(res.proxy_region).toBe("KR-residential");
      expect(res.cost_usdc).toBe(0.05);
      expect(res.x402_tx).toContain("pending_");
    });

    it("should fallback to default error string for geo-restricted source not in MOCK_RESPONSES", async () => {
      const untrackedGeoSource = { ...mockPriceSource, id: "untracked-geo" };
      const res = await scrapeViaProxy(untrackedGeoSource);
      expect(res.status_code).toBe(200);
      expect(JSON.parse(res.raw_text)).toEqual({ error: "proxy not configured" });
    });

    it("should throw error if direct fetch fails", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject(new Error("Network Error"))
      ) as any;

      await expect(scrapeViaProxy(mockNonGeoSource)).rejects.toThrow("Network Error");
    });

    it("should throw error if direct fetch fails with a non-Error object", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject("Raw string network error")
      ) as any;

      await expect(scrapeViaProxy(mockNonGeoSource)).rejects.toEqual("Raw string network error");
    });
  });
});
