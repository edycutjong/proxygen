import { jest } from "@jest/globals";
import { registerFeedRoutes } from "../feeds/api.js";
import { Orchestrator } from "../orchestrator.js";

describe("Feed API Server Routes", () => {
  let orchestrator: Orchestrator;
  let routes: Record<string, any>;
  let mockApp: any;

  beforeEach(() => {
    jest.useFakeTimers();
    orchestrator = new Orchestrator();
    routes = {};
    mockApp = {
      get: (path: string, handler: Function) => {
        routes[path] = handler;
      },
      post: (path: string, handler: Function) => {
        routes[path] = handler;
      },
    };
    registerFeedRoutes(mockApp, orchestrator);
  });

  afterEach(() => {
    orchestrator.stop();
    jest.useRealTimers();
  });

  it("should handle GET /health", async () => {
    const res = await routes["/health"]();
    expect(res).toEqual({
      status: "ok",
      agent: "Proxygen",
      version: "0.1.0",
      is_active: false,
      uptime_seconds: 0,
    });
  });

  it("should handle GET /api/dashboard", async () => {
    const res = await routes["/api/dashboard"]();
    expect(res).toHaveProperty("stats");
    expect(res).toHaveProperty("feed_items");
  });

  it("should handle GET /api/stats", async () => {
    const res = await routes["/api/stats"]();
    expect(res.total_scrapes).toBe(0);
  });

  it("should handle GET /api/feeds with query parameters", async () => {
    // Add items to store
    orchestrator.feedStore.add({
      id: "kr_price",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });

    orchestrator.feedStore.add({
      id: "us_volume",
      source: "coinbase-us",
      region: "US",
      type: "volume",
      data: { volume_24h: 50000 },
      confidence: 0.98,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    // 1. No query params (uses defaults)
    let res = await routes["/api/feeds"]({ query: {} });
    expect(res.count).toBe(2);

    // 2. Filter by source
    res = await routes["/api/feeds"]({ query: { source: "upbit-kr" } });
    expect(res.count).toBe(1);
    expect(res.items[0].id).toBe("kr_price");

    // 3. Filter by region
    res = await routes["/api/feeds"]({ query: { region: "US" } });
    expect(res.count).toBe(1);
    expect(res.items[0].id).toBe("us_volume");

    // 4. Filter by type
    res = await routes["/api/feeds"]({ query: { type: "volume" } });
    expect(res.count).toBe(1);
    expect(res.items[0].id).toBe("us_volume");

    // 5. Custom limit
    res = await routes["/api/feeds"]({ query: { limit: "1" } });
    expect(res.items.length).toBe(1);
  });

  it("should handle GET /api/signals/kimchi", async () => {
    orchestrator.feedStore.add({
      id: "kr_price",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });

    const res = await routes["/api/signals/kimchi"]();
    expect(res.signal).toBe("kimchi_premium");
    expect(res.sources).toContain("upbit-kr");
  });

  it("should handle GET /api/log", async () => {
    const res = await routes["/api/log"]({ query: { limit: "10" } });
    expect(res).toHaveProperty("entries");

    // Test fallback limit
    const resFallback = await routes["/api/log"]({ query: {} });
    expect(resFallback).toHaveProperty("entries");
  });

  it("should handle GET /api/payments", async () => {
    const res = await routes["/api/payments"]({ query: { limit: "5" } });
    expect(res).toHaveProperty("payments");
    expect(res).toHaveProperty("total_outflow");

    // Test fallback limit
    const resFallback = await routes["/api/payments"]({ query: {} });
    expect(resFallback).toHaveProperty("payments");
  });

  it("should handle GET /api/sources", async () => {
    const res = await routes["/api/sources"]();
    expect(res).toHaveProperty("sources");
    expect(res).toHaveProperty("summary");
  });

  it("should handle POST /api/cycle", async () => {
    const runCycleSpy = jest.spyOn(orchestrator, "runCycle").mockImplementation(() => Promise.resolve());
    const res = await routes["/api/cycle"]();
    expect(res).toEqual({ status: "cycle_triggered" });
    expect(runCycleSpy).toHaveBeenCalled();
  });

  it("should handle POST /api/scrape/:sourceId", async () => {
    const scrapeSourceSpy = jest.spyOn(orchestrator, "scrapeSource").mockImplementation(() => Promise.resolve());
    const res = await routes["/api/scrape/:sourceId"]({ params: { sourceId: "upbit-kr" } });
    expect(res).toEqual({ status: "scrape_triggered", source: "upbit-kr" });
    expect(scrapeSourceSpy).toHaveBeenCalledWith("upbit-kr");
  });

  it("should handle GET /api/events (SSE) and handle clean up / closed connection", async () => {
    const writeHeadMock = jest.fn();
    const writeMock = jest.fn();
    let closeHandler: (() => void) | undefined = undefined;

    const requestMock = {
      raw: {
        on: (event: string, handler: () => void) => {
          if (event === "close") {
            closeHandler = handler;
          }
        },
      },
    };

    const replyMock = {
      raw: {
        writeHead: writeHeadMock,
        write: writeMock,
      },
    };

    // Call SSE route handler
    await routes["/api/events"](requestMock, replyMock);

    expect(writeHeadMock).toHaveBeenCalledWith(200, expect.any(Object));
    expect(writeMock).toHaveBeenCalledTimes(1); // initial state write

    // Advance fake timers by 3 seconds to trigger the interval
    jest.advanceTimersByTime(3000);
    expect(writeMock).toHaveBeenCalledTimes(2);

    // Trigger close callback to check cleanup
    expect(closeHandler).toBeDefined();
    if (closeHandler) {
      (closeHandler as () => void)();
    }

    // Advance timers again - writeMock should NOT be called since interval is cleared
    const writesBefore = writeMock.mock.calls.length;
    jest.advanceTimersByTime(3000);
    expect(writeMock.mock.calls.length).toBe(writesBefore);
  });

  it("should handle GET /api/events (SSE) interval error and clear interval", async () => {
    const writeHeadMock = jest.fn();
    const writeMock = jest.fn();

    const requestMock = {
      raw: {
        on: jest.fn(),
      },
    };

    const replyMock = {
      raw: {
        writeHead: writeHeadMock,
        write: writeMock,
      },
    };

    await routes["/api/events"](requestMock, replyMock);

    // Make write throw an error on subsequent calls
    writeMock.mockImplementation(() => {
      throw new Error("Write failed");
    });

    // Advance fake timers by 3 seconds to trigger the interval
    jest.advanceTimersByTime(3000);
    
    // Clear interval should happen. We verify by checking that subsequent intervals don't execute write again
    writeMock.mockClear();
    jest.advanceTimersByTime(3000);
    expect(writeMock).not.toHaveBeenCalled();
  });
});
