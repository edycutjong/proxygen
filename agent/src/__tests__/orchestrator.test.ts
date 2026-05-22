import { jest } from "@jest/globals";
import type { Orchestrator as OrchestratorClass } from "../orchestrator.js";

// Mock scrapeViaProxy and extractWithLLM
const mockScrapeViaProxy = jest.fn() as any;
const mockExtractWithLLM = jest.fn() as any;

jest.unstable_mockModule("../ace/proxy.js", () => ({
  scrapeViaProxy: mockScrapeViaProxy,
}));

jest.unstable_mockModule("../ace/llm.js", () => ({
  extractWithLLM: mockExtractWithLLM,
}));

const { Orchestrator } = await import("../orchestrator.js");
import { DATA_SOURCES } from "../sources.js";
import { updateDemoMode } from "../config.js";

describe("Orchestrator", () => {
  let orchestrator: OrchestratorClass;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    orchestrator = new Orchestrator();
  });

  afterEach(() => {
    orchestrator.stop();
    jest.useRealTimers();
  });

  it("should initialize default properties", () => {
    expect(orchestrator.feedStore).toBeDefined();
    expect(orchestrator.decisionLog).toBeDefined();
    expect(orchestrator.healthMonitor).toBeDefined();
    
    const stats = orchestrator.getStats();
    expect(stats.is_active).toBe(false);
    expect(stats.total_scrapes).toBe(0);
    expect(stats.total_extractions).toBe(0);
    expect(stats.total_feed_queries).toBe(0);
  });

  it("should start and stop the scheduler loop", async () => {
    // Mock scrapeSource to prevent actual scraping in cycle
    const scrapeSpy = jest.spyOn(orchestrator, "scrapeSource").mockImplementation(() => Promise.resolve());

    orchestrator.start();
    expect(orchestrator.getStats().is_active).toBe(true);

    // Should call runCycle immediately
    expect(scrapeSpy).toHaveBeenCalled();

    // Re-starting shouldn't do anything
    const callsBefore = scrapeSpy.mock.calls.length;
    orchestrator.start();
    expect(scrapeSpy.mock.calls.length).toBe(callsBefore);

    // Fast-forward interval
    scrapeSpy.mockClear();
    jest.advanceTimersByTime(600000); // 10 min
    expect(scrapeSpy).toHaveBeenCalled();

    orchestrator.stop();
    expect(orchestrator.getStats().is_active).toBe(false);
  });

  it("should handle unknown or unscrapable sources in scrapeSource", async () => {
    // 1. Unknown source
    await orchestrator.scrapeSource("unknown-source");
    expect(mockScrapeViaProxy).not.toHaveBeenCalled();

    // 2. Unscrapable source (marked down)
    const sourceId = "upbit-kr";
    orchestrator.healthMonitor.recordFailure(sourceId, "error1");
    orchestrator.healthMonitor.recordFailure(sourceId, "error2");
    orchestrator.healthMonitor.recordFailure(sourceId, "error3"); // marks DOWN
    
    mockScrapeViaProxy.mockClear();
    await orchestrator.scrapeSource(sourceId);
    expect(mockScrapeViaProxy).not.toHaveBeenCalled();
  });

  it("should execute full scraping pipeline successfully", async () => {
    const sourceId = "upbit-kr";
    const mockScrapeRes = {
      raw_text: "mock html response",
      status_code: 200,
      latency_ms: 150,
      proxy_region: "KR-residential",
      cost_usdc: 0.05,
      x402_tx: "tx_proxy_123",
    };
    mockScrapeViaProxy.mockResolvedValue(mockScrapeRes);

    const mockExtractRes = {
      feed_item: {
        id: "item_123",
        source: sourceId,
        region: "KR",
        type: "price",
        data: { price: 80000000 },
        confidence: 0.95,
        proxy_region: "KR-residential",
        cost_usdc: 0.07, // proxy + llm
        timestamp: new Date().toISOString(),
      },
      model_used: "gpt-4o-mini",
      latency_ms: 500,
      cost_usdc: 0.02,
      x402_tx: "tx_llm_123",
    };
    mockExtractWithLLM.mockResolvedValue(mockExtractRes);

    await orchestrator.scrapeSource(sourceId);

    expect(mockScrapeViaProxy).toHaveBeenCalledWith(
      expect.objectContaining({ id: sourceId })
    );
    expect(mockExtractWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({ id: sourceId }),
      mockScrapeRes.raw_text,
      mockScrapeRes.proxy_region,
      mockScrapeRes.cost_usdc
    );

    // Verify stats & logs
    const stats = orchestrator.getStats();
    expect(stats.total_scrapes).toBe(1);
    expect(stats.total_extractions).toBe(1);
    expect(stats.feed_items_cached).toBe(1);
    expect(stats.total_x402_outflow_usdc).toBe(0.07);

    const entries = orchestrator.decisionLog.getEntries();
    expect(entries.some((e) => e.message.includes("Scraped Upbit: 200"))).toBe(true);
    expect(entries.some((e) => e.message.includes("Feed updated"))).toBe(true);

    const payments = orchestrator.decisionLog.getPayments();
    expect(payments.length).toBe(2); // proxy payment + llm payment
  });

  it("should record failures and handle failover / self-healing", async () => {
    const sourceId = "upbit-kr";
    mockScrapeViaProxy.mockRejectedValue(new Error("Scrape timeout"));

    // 1st failure
    await orchestrator.scrapeSource(sourceId);
    expect(orchestrator.healthMonitor.get(sourceId)?.status).toBe("degraded");
    
    // 2nd failure
    await orchestrator.scrapeSource(sourceId);
    expect(orchestrator.healthMonitor.get(sourceId)?.status).toBe("degraded");

    // 3rd failure (triggers failover callback)
    await orchestrator.scrapeSource(sourceId);
    expect(orchestrator.healthMonitor.get(sourceId)?.status).toBe("discovering");

    const entries = orchestrator.decisionLog.getEntries();
    expect(entries.some((e) => e.message.includes("re-discovering proxy"))).toBe(true);

    // Advance fake timers by 5s to simulate self-healing timer completion
    jest.advanceTimersByTime(5000);
    expect(orchestrator.healthMonitor.get(sourceId)?.status).toBe("healthy");
    expect(orchestrator.decisionLog.getEntries().some((e) => e.message.includes("Recovery complete"))).toBe(true);
  });

  it("should record consumer query payment inflow", () => {
    orchestrator.recordQuery("check BTC rates");
    const stats = orchestrator.getStats();
    expect(stats.total_feed_queries).toBe(1);
    expect(stats.total_x402_inflow_usdc).toBe(0.01);
  });

  it("should run cycle across all enabled sources", async () => {
    // Mock scrapeSource to check how many times it was called
    const scrapeSpy = jest.spyOn(orchestrator, "scrapeSource").mockImplementation(() => Promise.resolve());
    
    // Add KR & US sources in store to verify kimchi premium logs
    orchestrator.feedStore.add({
      id: "kr",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 85800000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });
    orchestrator.feedStore.add({
      id: "us",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 62500 },
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    await orchestrator.runCycle();

    const enabledSourcesCount = DATA_SOURCES.filter((s) => s.enabled).length;
    expect(scrapeSpy).toHaveBeenCalledTimes(enabledSourcesCount);

    const entries = orchestrator.decisionLog.getEntries();
    expect(entries.some((e) => e.message.includes("Kimchi premium: 4%"))).toBe(true);
  });

  it("should return dashboard state correctly", () => {
    const state = orchestrator.getDashboardState();
    expect(state).toHaveProperty("stats");
    expect(state).toHaveProperty("feed_items");
    expect(state).toHaveProperty("decision_log");
    expect(state).toHaveProperty("source_health");
    expect(state).toHaveProperty("payments");
  });

  it("should record consumer query payment inflow with no description", () => {
    orchestrator.recordQuery();
    const stats = orchestrator.getStats();
    expect(stats.total_feed_queries).toBe(1);
    expect(stats.total_x402_inflow_usdc).toBe(0.01);
  });

  it("should handle pipeline failures with non-Error objects", async () => {
    const sourceId = "upbit-kr";
    mockScrapeViaProxy.mockRejectedValue("Scrape pipeline hard failure");

    await orchestrator.scrapeSource(sourceId);

    const entries = orchestrator.decisionLog.getEntries();
    expect(entries.some((e) => e.message.includes("Scrape pipeline hard failure"))).toBe(true);
  });

  it("should return undefined wallet balance if DEMO_MODE is false", () => {
    process.env.PROXYGEN_DEMO = "false";
    updateDemoMode();
    try {
      const stats = orchestrator.getStats();
      expect(stats.wallet_balance_usdc).toBeUndefined();
    } finally {
      process.env.PROXYGEN_DEMO = "true";
      updateDemoMode();
    }
  });

  it("should log LIVE mode when orchestrator starts with DEMO_MODE false", () => {
    process.env.PROXYGEN_DEMO = "false";
    updateDemoMode();
    try {
      const o = new Orchestrator();
      const scrapeSpy = jest.spyOn(o, "scrapeSource").mockImplementation(() => Promise.resolve());
      o.start();
      expect(o.decisionLog.getEntries().some((e) => e.message.includes("Agent started in LIVE mode"))).toBe(true);
      o.stop();
    } finally {
      process.env.PROXYGEN_DEMO = "true";
      updateDemoMode();
    }
  });
});
