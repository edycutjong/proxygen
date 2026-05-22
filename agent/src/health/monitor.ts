// ─── Health Monitor ───────────────────────────────────────────
// Tracks health status of each data source. Triggers failover
// when consecutive failures exceed threshold.

import type { SourceHealth } from "../types.js";
import { DATA_SOURCES } from "../sources.js";
import { log } from "../config.js";

const FAILURE_THRESHOLD = 3;

export class HealthMonitor {
  private health: Map<string, SourceHealth> = new Map();
  private failoverCallbacks: Array<(sourceId: string) => void> = [];

  constructor() {
    // Initialize health for all enabled sources
    for (const source of DATA_SOURCES.filter((s) => s.enabled)) {
      this.health.set(source.id, {
        source_id: source.id,
        status: "healthy",
        last_scrape: null,
        last_error: null,
        success_rate: 1.0,
        avg_latency_ms: 0,
        consecutive_failures: 0,
      });
    }
  }

  /** Register a callback for failover events. */
  onFailover(callback: (sourceId: string) => void): void {
    this.failoverCallbacks.push(callback);
  }

  /** Record a successful scrape. */
  recordSuccess(sourceId: string, latencyMs: number): void {
    const h = this.health.get(sourceId);
    if (!h) return;

    h.last_scrape = new Date().toISOString();
    h.last_error = null;
    h.consecutive_failures = 0;
    h.avg_latency_ms = h.avg_latency_ms === 0
      ? latencyMs
      : Math.round(h.avg_latency_ms * 0.8 + latencyMs * 0.2); // EWMA
    h.success_rate = Math.min(1.0, h.success_rate * 0.9 + 0.1);
    h.status = h.success_rate > 0.8 ? "healthy" : "degraded";
  }

  /** Record a failed scrape. */
  recordFailure(sourceId: string, error: string): void {
    const h = this.health.get(sourceId);
    if (!h) return;

    h.last_error = error;
    h.consecutive_failures += 1;
    h.success_rate = Math.max(0, h.success_rate * 0.9);

    if (h.consecutive_failures >= FAILURE_THRESHOLD) {
      h.status = "down";
      log("warn", `Source ${sourceId} marked DOWN after ${h.consecutive_failures} failures`);
      // Trigger failover
      for (const cb of this.failoverCallbacks) {
        cb(sourceId);
      }
    } else {
      h.status = "degraded";
    }
  }

  /** Mark a source as "discovering" (during failover). */
  markDiscovering(sourceId: string): void {
    const h = this.health.get(sourceId);
    if (h) h.status = "discovering";
  }

  /** Get health status for all sources. */
  getAll(): SourceHealth[] {
    return Array.from(this.health.values());
  }

  /** Get health for a specific source. */
  get(sourceId: string): SourceHealth | undefined {
    return this.health.get(sourceId);
  }

  /** Check if a source is healthy enough to scrape. */
  isScrapable(sourceId: string): boolean {
    const h = this.health.get(sourceId);
    if (!h) return false;
    return h.status !== "down" && h.status !== "discovering";
  }

  /** Get summary counts. */
  getSummary(): { healthy: number; degraded: number; down: number; discovering: number } {
    let healthy = 0, degraded = 0, down = 0, discovering = 0;
    for (const h of this.health.values()) {
      switch (h.status) {
        case "healthy": healthy++; break;
        case "degraded": degraded++; break;
        case "down": down++; break;
        case "discovering": discovering++; break;
      }
    }
    return { healthy, degraded, down, discovering };
  }
}
