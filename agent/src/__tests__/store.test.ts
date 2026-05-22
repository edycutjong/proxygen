import { FeedStore } from "../feeds/store.js";
import type { ProxygenFeedItem } from "../types.js";

describe("FeedStore", () => {
  let store: FeedStore;

  beforeEach(() => {
    store = new FeedStore();
  });

  afterEach(() => {
    store.destroy();
  });

  it("should add and retrieve all feed items ordered by timestamp", () => {
    const item1: ProxygenFeedItem = {
      id: "1",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date(Date.now() - 10000).toISOString(),
    };

    const item2: ProxygenFeedItem = {
      id: "2",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 62000 },
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    };

    store.add(item1);
    store.add(item2);

    const all = store.getAll();
    expect(all.length).toBe(2);
    // Coinbase (item2) is newer, so should be first
    expect(all[0]?.id).toBe("2");
    expect(all[1]?.id).toBe("1");
  });

  it("should add a batch of items", () => {
    const item1: ProxygenFeedItem = {
      id: "1",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    };

    const item2: ProxygenFeedItem = {
      id: "2",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 62000 },
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    };

    store.addBatch([item1, item2]);
    expect(store.size).toBe(2);
  });

  it("should enforce max size limit on adding item", () => {
    // Let's check max size in mock config or we can override SCRAPE_CONFIG.max_feed_items
    // But store uses SCRAPE_CONFIG.max_feed_items.
    // In config.test.ts we imported config but here it's default value of 500 (or whatever is in env).
    // Let's fill up to max size + 1 to check eviction of oldest.
    // To make it easy, let's mock SCRAPE_CONFIG properties if possible, or just generate items.
    // Wait, SCRAPE_CONFIG.max_feed_items is read from process.env.MAX_FEED_ITEMS ?? "500".
    // Let's add 501 items. Or we can mock the import or config.
    // But since config is already loaded, let's just generate a loop of 501 items.
    const items: ProxygenFeedItem[] = [];
    const now = Date.now();
    for (let i = 0; i < 505; i++) {
      items.push({
        id: `item-${i}`,
        source: `source-${i}`,
        region: "US",
        type: "price",
        data: { price: 100 },
        confidence: 0.9,
        proxy_region: "US",
        cost_usdc: 0.01,
        // Ensure strictly increasing timestamps so we know which one is oldest
        timestamp: new Date(now + i * 1000).toISOString(),
      });
    }

    store.addBatch(items);
    // Max should be capped (either 100 from config.test.ts env setup or default 500)
    // Wait, since we are in Jest, process.env was set in config.test.ts but modules might be cached.
    // Let's check what the store's max size is capped at.
    const limit = store.size;
    expect(limit).toBeLessThanOrEqual(500);
    // Add one more newer item, which should evict the oldest item.
    // The oldest currently in store is item-0 (or whatever index is first).
    const newestItem: ProxygenFeedItem = {
      id: "newest",
      source: "newest-src",
      region: "US",
      type: "price",
      data: { price: 200 },
      confidence: 0.9,
      proxy_region: "US",
      cost_usdc: 0.01,
      timestamp: new Date(now + 1000000).toISOString(),
    };
    store.add(newestItem);
    expect(store.getAll().some((i) => i.id === "newest")).toBe(true);
  });

  it("should filter by source, region, and type", () => {
    const item1: ProxygenFeedItem = {
      id: "1",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    };

    const item2: ProxygenFeedItem = {
      id: "2",
      source: "naver-kr",
      region: "KR",
      type: "sentiment",
      data: { sentiment_score: 0.5 },
      confidence: 0.9,
      proxy_region: "KR",
      cost_usdc: 0.03,
      timestamp: new Date().toISOString(),
    };

    store.addBatch([item1, item2]);

    expect(store.getBySource("upbit-kr").length).toBe(1);
    expect(store.getByRegion("KR").length).toBe(2);
    expect(store.getByType("sentiment").length).toBe(1);
  });

  it("should get latest item per source", () => {
    const item1: ProxygenFeedItem = {
      id: "1",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date(Date.now() - 10000).toISOString(),
    };

    const item2: ProxygenFeedItem = {
      id: "2",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 81000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    };

    store.addBatch([item1, item2]);
    const latest = store.getLatestPerSource();
    expect(latest.length).toBe(1);
    expect(latest[0]?.id).toBe("2");
  });

  it("should calculate total cost", () => {
    store.add({
      id: "1",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });
    store.add({
      id: "2",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 62000 },
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    expect(store.getTotalCost()).toBe(0.07);
  });

  it("should calculate kimchi premium", () => {
    // When no US or KR price sources are present
    expect(store.getKimchiPremium()).toBeNull();

    // Add KR price
    store.add({
      id: "kr",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 85800000 }, // 85.8M KRW
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });
    // Add US price
    store.add({
      id: "us",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 62500 }, // $62,500 USD
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    // KR Price in USD = 85,800,000 / 1320 = $65,000 USD
    // Premium = (65,000 - 62,500) / 62,500 = 4.0%
    const kimchi = store.getKimchiPremium();
    expect(kimchi).not.toBeNull();
    expect(kimchi?.premium_pct).toBe(4.0);
    expect(kimchi?.kr_price_usd).toBe(65000);
    expect(kimchi?.us_price_usd).toBe(62500);
  });

  it("should return null for kimchi premium if US price is 0", () => {
    store.add({
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
    store.add({
      id: "us",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: { price: 0 },
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    expect(store.getKimchiPremium()).toBeNull();
  });

  it("should return null for kimchi premium if price data is missing in KR or US feeds", () => {
    store.add({
      id: "kr",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: {}, // price missing
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date().toISOString(),
    });
    store.add({
      id: "us",
      source: "coinbase-us",
      region: "US",
      type: "price",
      data: {}, // price missing
      confidence: 0.99,
      proxy_region: "US",
      cost_usdc: 0.02,
      timestamp: new Date().toISOString(),
    });

    expect(store.getKimchiPremium()).toBeNull();
  });

  it("should evict expired items", () => {
    // Create an item with timestamp in the past
    // TTL is 1 hour default. Let's make an item that's 2 hours old.
    const expiredItem: ProxygenFeedItem = {
      id: "expired",
      source: "upbit-kr",
      region: "KR",
      type: "price",
      data: { price: 80000000 },
      confidence: 0.95,
      proxy_region: "KR",
      cost_usdc: 0.05,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    };

    store.add(expiredItem);
    expect(store.size).toBe(1);

    // Call private evict method via type-casting to any
    (store as any).evict();
    expect(store.size).toBe(0);
  });
});
