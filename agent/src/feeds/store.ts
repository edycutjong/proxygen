// ─── Feed Store ───────────────────────────────────────────────
// In-memory cache for structured data feed items with TTL eviction.

import type { ProxygenFeedItem } from "../types.js";
import { SCRAPE_CONFIG, log } from "../config.js";

export class FeedStore {
  private items: Map<string, ProxygenFeedItem> = new Map();
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Run eviction every 60 seconds
    this.evictionTimer = setInterval(() => this.evict(), 60_000);
  }

  /** Add or update a feed item. */
  add(item: ProxygenFeedItem): void {
    // Enforce max size
    if (this.items.size >= SCRAPE_CONFIG.max_feed_items) {
      // Remove oldest item
      const oldest = this.getOldest();
      if (oldest) this.items.delete(oldest.id);
    }
    this.items.set(item.id, item);
  }

  /** Add multiple items. */
  addBatch(items: ProxygenFeedItem[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  /** Get all items, newest first. */
  getAll(): ProxygenFeedItem[] {
    return Array.from(this.items.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /** Get items by source ID. */
  getBySource(sourceId: string): ProxygenFeedItem[] {
    return this.getAll().filter((item) => item.source === sourceId);
  }

  /** Get items by region. */
  getByRegion(region: string): ProxygenFeedItem[] {
    return this.getAll().filter((item) => item.region === region);
  }

  /** Get items by type. */
  getByType(type: ProxygenFeedItem["type"]): ProxygenFeedItem[] {
    return this.getAll().filter((item) => item.type === type);
  }

  /** Get the latest item for each source. */
  getLatestPerSource(): ProxygenFeedItem[] {
    const latestMap = new Map<string, ProxygenFeedItem>();
    for (const item of this.items.values()) {
      const existing = latestMap.get(item.source);
      if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
        latestMap.set(item.source, item);
      }
    }
    return Array.from(latestMap.values());
  }

  /** Get total count. */
  get size(): number {
    return this.items.size;
  }

  /** Calculate total x402 cost of all cached items. */
  getTotalCost(): number {
    let total = 0;
    for (const item of this.items.values()) {
      total += item.cost_usdc;
    }
    return Math.round(total * 1000) / 1000;
  }

  getKimchiPremium(): { premium_pct: number; kr_price_usd: number; us_price_usd: number } | null {
    const krItems = this.getByRegion("KR").filter((i) => i.type === "price" && typeof i.data.price === "number");
    const usItems = this.getByRegion("US").filter((i) => i.type === "price" && typeof i.data.price === "number");

    if (krItems.length === 0 || usItems.length === 0) return null;

    const krItem = krItems[0]!;
    const usItem = usItems[0]!;

    // Approximate KRW/USD rate
    const krwRate = 1_320;
    const krPriceUsd = (krItem.data.price as number) / krwRate;
    const usPriceUsd = usItem.data.price as number;

    if (usPriceUsd === 0) return null;

    const premiumPct = ((krPriceUsd - usPriceUsd) / usPriceUsd) * 100;
    return {
      premium_pct: Math.round(premiumPct * 100) / 100,
      kr_price_usd: Math.round(krPriceUsd * 100) / 100,
      us_price_usd: Math.round(usPriceUsd * 100) / 100,
    };
  }

  /** Evict expired items. */
  private evict(): void {
    const now = Date.now();
    let evicted = 0;
    for (const [id, item] of this.items) {
      if (now - new Date(item.timestamp).getTime() > SCRAPE_CONFIG.feed_ttl_ms) {
        this.items.delete(id);
        evicted++;
      }
    }
    if (evicted > 0) {
      log("debug", `Evicted ${evicted} expired feed items`);
    }
  }

  /** Get oldest item. */
  private getOldest(): ProxygenFeedItem | null {
    let oldest: ProxygenFeedItem | null = null;
    for (const item of this.items.values()) {
      if (!oldest || new Date(item.timestamp) < new Date(oldest.timestamp)) {
        oldest = item;
      }
    }
    return oldest;
  }

  /** Clean up timers. */
  destroy(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
  }
}
