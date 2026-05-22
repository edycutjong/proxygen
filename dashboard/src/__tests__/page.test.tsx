import { jest } from "@jest/globals";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import DashboardPage from "../app/page";
import type { DashboardState } from "@/lib/types";

// Helper to flush microtasks / promises without using any mocked timer APIs
const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("DashboardPage & Subcomponents", () => {
  let mockFetch: jest.Mock<typeof global.fetch>;

  beforeEach(() => {
    mockFetch = jest.fn() as unknown as jest.Mock<typeof global.fetch>;
    global.fetch = mockFetch;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockStateSuccess: DashboardState = {
    stats: {
      is_active: true,
      uptime_seconds: 7300, // 2h 1m
      total_scrapes: 10,
      total_extractions: 5,
      total_feed_queries: 15,
      total_x402_outflow_usdc: 0.005,
      total_x402_inflow_usdc: 0.012, // Net = +0.007
      sources_healthy: 3,
      sources_degraded: 1,
      sources_down: 0,
      feed_items_cached: 12,
      last_cycle_at: "2026-05-22T04:00:00.000Z",
      wallet_balance_usdc: 150.25,
    },
    feed_items: [
      {
        id: "1",
        source: "Upbit",
        region: "KR",
        type: "price",
        data: { price: 132000000 }, // ₩132.0M
        confidence: 0.95,
        proxy_region: "KR",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:00Z",
      },
      {
        id: "2",
        source: "Coinbase",
        region: "US",
        type: "price",
        data: { price: 95000 }, // $95,000
        confidence: 0.9,
        proxy_region: "US",
        cost_usdc: 0.002,
        timestamp: "2026-05-22T11:00:01Z",
      },
      {
        id: "3",
        source: "OKX",
        region: "CN",
        type: "price",
        data: { price: 650000 }, // ¥650,000
        confidence: 0.85,
        proxy_region: "CN",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:02Z",
      },
      {
        id: "4",
        source: "BinanceJP",
        region: "JP",
        type: "price",
        data: { price: 12000000 }, // ¥1200.0万
        confidence: 0.75,
        proxy_region: "JP",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:03Z",
      },
      {
        id: "5",
        source: "BinanceEU",
        region: "EU",
        type: "price",
        data: { price: 90000 }, // $90,000
        confidence: 0.65,
        proxy_region: "EU",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:04Z",
      },
      {
        id: "6",
        source: "TwitterSentiment",
        region: "SG",
        type: "sentiment",
        data: { sentiment_score: 0.85 }, // +0.85
        confidence: 0.98,
        proxy_region: "SG",
        cost_usdc: 0.0005,
        timestamp: "2026-05-22T11:00:05Z",
      },
      {
        id: "7",
        source: "RedditSentiment",
        region: "US",
        type: "sentiment",
        data: { sentiment_score: -0.45 }, // -0.45
        confidence: 0.82,
        proxy_region: "US",
        cost_usdc: 0.0005,
        timestamp: "2026-05-22T11:00:06Z",
      },
      {
        id: "8",
        source: "TelegramSentiment",
        region: "US",
        type: "sentiment",
        data: { sentiment_score: 0.0 }, // 0.00
        confidence: 0.5,
        proxy_region: "US",
        cost_usdc: 0.0005,
        timestamp: "2026-05-22T11:00:07Z",
      },
      {
        id: "9",
        source: "UKPrice",
        region: "UK",
        type: "price",
        data: { price: undefined },
        confidence: 0.8,
        proxy_region: "UK",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:08Z",
      },
      {
        id: "10",
        source: "CustomVolume",
        region: "US",
        type: "volume",
        data: { volume_24h: 100000 },
        confidence: 0.81,
        proxy_region: "US",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:09Z",
      },
      {
        id: "11",
        source: "UndefinedSentiment",
        region: "US",
        type: "sentiment",
        data: { sentiment_score: undefined },
        confidence: 0.6,
        proxy_region: "US",
        cost_usdc: 0.0005,
        timestamp: "2026-05-22T11:00:10Z",
      },
    ],
    decision_log: [
      { id: "d1", timestamp: "2026-05-22T11:00:00Z", type: "discovery", message: "discovery msg" },
      { id: "d2", timestamp: "2026-05-22T11:00:01Z", type: "scrape", message: "scrape msg" },
      { id: "d3", timestamp: "2026-05-22T11:00:02Z", type: "extract", message: "extract msg" },
      { id: "d4", timestamp: "2026-05-22T11:00:03Z", type: "payment", message: "payment msg" },
      { id: "d5", timestamp: "2026-05-22T11:00:04Z", type: "failover", message: "failover msg" },
      { id: "d6", timestamp: "2026-05-22T11:00:05Z", type: "publish", message: "publish msg" },
      { id: "d7", timestamp: "2026-05-22T11:00:06Z", type: "error", message: "error msg" },
      { id: "d8", timestamp: "2026-05-22T11:00:07Z", type: "unknown-type" as never, message: "unknown type msg", metadata: {} },
    ],
    source_health: [
      { source_id: "upbit-kr", status: "healthy", last_scrape: "2026-05-22T11:00:00Z", last_error: null, success_rate: 1.0, avg_latency_ms: 150, consecutive_failures: 0 },
      { source_id: "coinbase-us", status: "degraded", last_scrape: "2026-05-22T11:00:01Z", last_error: "timeout", success_rate: 0.8, avg_latency_ms: 320, consecutive_failures: 1 },
      { source_id: "okx-cn", status: "down", last_scrape: null, last_error: "auth failed", success_rate: 0.0, avg_latency_ms: 0, consecutive_failures: 5 },
      { source_id: "binance-jp", status: "discovering", last_scrape: null, last_error: null, success_rate: 0.0, avg_latency_ms: 220, consecutive_failures: 0 },
      { source_id: "custom", status: "healthy", last_scrape: "2026-05-22T11:00:00Z", last_error: null, success_rate: 1.0, avg_latency_ms: 100, consecutive_failures: 0 },
      {
        source_id: {
          split: () => [],
          toString: () => "custom-empty",
        } as unknown as string,
        status: "healthy",
        last_scrape: "2026-05-22T11:00:00Z",
        last_error: null,
        success_rate: 1.0,
        avg_latency_ms: 100,
        consecutive_failures: 0,
      },
    ],
    payments: Array.from({ length: 11 }, (_, i) => ({
      id: `p-${i}`,
      timestamp: "2026-05-22T11:00:00Z",
      direction: i % 2 === 0 ? "inflow" : "outflow",
      amount_usdc: 0.001 * (i + 1),
      service: `service-${i}`,
      status: "settled",
    })),
  };

  const mockStateAlt: DashboardState = {
    stats: {
      is_active: false,
      uptime_seconds: 360, // 0h 6m
      total_scrapes: 0,
      total_extractions: 0,
      total_feed_queries: 0,
      total_x402_outflow_usdc: 0.0,
      total_x402_inflow_usdc: 0.0, // net = 0
      sources_healthy: 0,
      sources_degraded: 0,
      sources_down: 0,
      feed_items_cached: 0,
      last_cycle_at: null,
      wallet_balance_usdc: undefined,
    },
    feed_items: [],
    decision_log: [],
    source_health: [],
    payments: [],
  };

  const mockStateNegativeNetPremium: DashboardState = {
    stats: {
      is_active: true,
      uptime_seconds: 100,
      total_scrapes: 1,
      total_extractions: 1,
      total_feed_queries: 1,
      total_x402_outflow_usdc: 0.05,
      total_x402_inflow_usdc: 0.02, // Net = -0.03
      sources_healthy: 1,
      sources_degraded: 0,
      sources_down: 0,
      feed_items_cached: 1,
      last_cycle_at: "2026-05-22T04:00:00.000Z",
      wallet_balance_usdc: 10.0,
    },
    feed_items: [
      {
        id: "1",
        source: "Upbit",
        region: "KR",
        type: "price",
        data: { price: 118800000 }, // ₩118.8M -> $90,000 USD
        confidence: 0.95,
        proxy_region: "KR",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:00Z",
      },
      {
        id: "2",
        source: "Coinbase",
        region: "US",
        type: "price",
        data: { price: 95000 }, // $95,000 USD -> Premium is -5.26%
        confidence: 0.9,
        proxy_region: "US",
        cost_usdc: 0.002,
        timestamp: "2026-05-22T11:00:01Z",
      },
    ],
    decision_log: [],
    source_health: [],
    payments: [],
  };

  const mockStateNaNPremium: DashboardState = {
    stats: {
      is_active: true,
      uptime_seconds: 100,
      total_scrapes: 1,
      total_extractions: 1,
      total_feed_queries: 1,
      total_x402_outflow_usdc: 0.0,
      total_x402_inflow_usdc: 0.0,
      sources_healthy: 1,
      sources_degraded: 0,
      sources_down: 0,
      feed_items_cached: 1,
      last_cycle_at: "2026-05-22T04:00:00.000Z",
    },
    feed_items: [
      {
        id: "1",
        source: "Upbit",
        region: "KR",
        type: "price",
        data: { price: "invalid" as unknown as number }, // Trigger NaN premium
        confidence: 0.95,
        proxy_region: "KR",
        cost_usdc: 0.001,
        timestamp: "2026-05-22T11:00:00Z",
      },
      {
        id: "2",
        source: "Coinbase",
        region: "US",
        type: "price",
        data: { price: 95000 },
        confidence: 0.9,
        proxy_region: "US",
        cost_usdc: 0.002,
        timestamp: "2026-05-22T11:00:01Z",
      },
    ],
    decision_log: [],
    source_health: [],
    payments: [],
  };

  it("renders success state dashboard correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStateSuccess,
    } as Response);

    render(<DashboardPage />);

    // Wait for the state to load
    await act(async () => {
      await flushPromises();
    });

    // Check header stats
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("↑ 2h 1m")).toBeTruthy();
    expect(screen.getByText("150.25 USDC")).toBeTruthy();

    // Check stats bar
    expect(screen.getByText("10")).toBeTruthy(); // Scrapes
    expect(screen.getByText("5")).toBeTruthy(); // Extractions
    expect(screen.getByText("15")).toBeTruthy(); // Feed Queries
    expect(screen.getByText("12")).toBeTruthy(); // Cached Items
    expect(screen.getByText("$0.005")).toBeTruthy(); // Outflow
    expect(screen.getByText("$0.012")).toBeTruthy(); // Inflow
    expect(screen.getByText("+$0.007")).toBeTruthy(); // Net P&L

    // Check feed items rendering & price/sentiment formatting
    expect(screen.getByText("Upbit")).toBeTruthy();
    expect(screen.getByText("₩132.0M")).toBeTruthy(); // KR price 132000000
    expect(screen.getByText("¥650,000")).toBeTruthy(); // CN price 650000
    expect(screen.getByText("¥1200.0万")).toBeTruthy(); // JP price 12000000
    expect(screen.getByText("$90,000")).toBeTruthy(); // EU price 90000
    expect(screen.getByText("+0.85")).toBeTruthy(); // SG sentiment score
    expect(screen.getByText("-0.45")).toBeTruthy(); // US sentiment score
    expect(screen.getByText("0.00")).toBeTruthy(); // US sentiment score 0.0
    expect(screen.getByText("UKPrice")).toBeTruthy();
    expect(screen.getByText("CustomVolume")).toBeTruthy();
    expect(screen.getByText("UndefinedSentiment")).toBeTruthy();
    expect(screen.getAllByText("🌍").length).toBeGreaterThan(0); // UK region flag fallback
    expect(screen.getByText("custom")).toBeTruthy();

    // Check confidence coloring classes
    const upbitConfidence = screen.getByText("95%");
    expect(upbitConfidence.className).toContain("text-[var(--color-accent-green)]");
    const binaryJpConfidence = screen.getByText("75%");
    expect(binaryJpConfidence.className).toContain("text-[var(--color-accent-amber)]");
    const telegramConfidence = screen.getByText("50%");
    expect(telegramConfidence.className).toContain("text-[var(--color-accent-red)]");

    // Check decision logs and custom status badges mapping
    expect(screen.getByText("discovery msg")).toBeTruthy();
    expect(screen.getByText("scrape msg")).toBeTruthy();
    expect(screen.getByText("extract msg")).toBeTruthy();
    expect(screen.getByText("payment msg")).toBeTruthy();
    expect(screen.getByText("failover msg")).toBeTruthy();
    expect(screen.getByText("publish msg")).toBeTruthy();
    expect(screen.getByText("error msg")).toBeTruthy();
    expect(screen.getByText("unknown type msg")).toBeTruthy();

    // Check source health mapping and flags
    expect(screen.getByText("upbit")).toBeTruthy();
    expect(screen.getByText("coinbase")).toBeTruthy();
    expect(screen.getByText("okx")).toBeTruthy();
    expect(screen.getByText("binance")).toBeTruthy();

    // Check payments list slice (max 10 items)
    // p-0 to p-9 should be displayed, p-10 should not
    expect(screen.queryByText("service-0")).toBeTruthy();
    expect(screen.queryByText("service-9")).toBeTruthy();
    expect(screen.queryByText("service-10")).toBeNull();

    // Check kimchi premium calculations
    expect(screen.getByText("KIMCHI PREMIUM SIGNAL")).toBeTruthy();
    expect(screen.getByText("+5.3%")).toBeTruthy();

    // Check footer connection badge
    expect(screen.getByText(/Connected/)).toBeTruthy();
  });

  it("renders alternative and empty states", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStateAlt,
    } as Response);

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByText("OFFLINE")).toBeTruthy();
    expect(screen.getByText("↑ 0h 6m")).toBeTruthy();
    expect(screen.getByText("— USDC")).toBeTruthy();
    expect(screen.getAllByText("$0.000").length).toBe(2); // Outflow/Inflow values both show $0.000
    expect(screen.getByText("+$0.0000")).toBeTruthy(); // Net P&L shows +$0.0000
    expect(screen.getByText("Waiting for first scrape cycle...")).toBeTruthy();
    expect(screen.getByText("No decisions yet...")).toBeTruthy();
    expect(screen.queryByText("KIMCHI PREMIUM SIGNAL")).toBeNull();
  });

  it("renders negative Net P&L and negative Kimchi premium", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStateNegativeNetPremium,
    } as Response);

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    // Net P&L should be negative
    expect(screen.getByText("-$0.030")).toBeTruthy();
    // Kimchi premium should be negative
    expect(screen.getByText("-5.3%")).toBeTruthy();
  });

  it("renders null for NaN premium in Kimchi premium banner", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStateNaNPremium,
    } as Response);

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.queryByText("KIMCHI PREMIUM SIGNAL")).toBeNull();
  });

  it("handles agent connection failure and displays error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByText("⚠ Agent not connected")).toBeTruthy();
    expect(screen.getByText("Cannot connect to agent. Make sure the agent is running on port 3001.")).toBeTruthy();
  });

  it("handles HTTP error status codes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByText("⚠ Agent not connected")).toBeTruthy();
    expect(screen.getByText("Cannot connect to agent. Make sure the agent is running on port 3001.")).toBeTruthy();
  });

  it("polls periodically every 3 seconds", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStateSuccess,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStateAlt,
      } as Response);

    render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByText("ACTIVE")).toBeTruthy();

    // Advance timer by 3 seconds
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await flushPromises();
    });

    // Should fetch the second time and change to OFFLINE
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText("OFFLINE")).toBeTruthy();
  });

  it("ignores state updates after unmount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStateSuccess,
    } as Response);

    const { unmount } = render(<DashboardPage />);

    await act(async () => {
      await flushPromises();
    });

    unmount();

    // Advance timer to trigger interval
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await flushPromises();
    });

    // Interval fetch should have happened or not, but state set shouldn't warning or error
  });

  it("does not set state if unmounted before fetch resolves", async () => {
    let resolveFetch: () => void = () => {};
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = () => resolve({
        ok: true,
        json: async () => mockStateSuccess,
      });
    });
    mockFetch.mockReturnValueOnce(fetchPromise as Promise<Response>);

    const { unmount } = render(<DashboardPage />);

    // Component is rendered, fetch is initiated but pending.
    // Now unmount the component
    unmount();

    // Now resolve the fetch promise
    await act(async () => {
      resolveFetch();
      await flushPromises();
    });

    // The fetch callback runs, but since active is false, it shouldn't call setState.
  });

  it("does not set error if unmounted before fetch rejects", async () => {
    let rejectFetch: () => void = () => {};
    const fetchPromise = new Promise((_, reject) => {
      rejectFetch = () => reject(new Error("Connection refused"));
    });
    mockFetch.mockReturnValueOnce(fetchPromise as Promise<Response>);

    const { unmount } = render(<DashboardPage />);

    // Component is rendered, fetch is initiated but pending.
    // Now unmount the component
    unmount();

    // Now reject the fetch promise
    await act(async () => {
      rejectFetch();
      await flushPromises();
    });

    // The catch block runs, but since active is false, it shouldn't call setError.
  });
});
