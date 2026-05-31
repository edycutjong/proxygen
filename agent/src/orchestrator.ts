// ─── Proxygen Orchestrator ─────────────────────────────────────
// Core pipeline: Source Discovery → Proxy Scraping → LLM Extraction → Feed Publication
// This is the beating heart of the autonomous agent.

import { log, DEMO_MODE, SCRAPE_CONFIG } from "./config.js";
import { DATA_SOURCES } from "./sources.js";
import { FeedStore } from "./feeds/store.js";
import { DecisionLog } from "./feeds/log.js";
import { HealthMonitor } from "./health/monitor.js";
import { scrapeViaProxy } from "./ace/proxy.js";
import { extractWithLLM } from "./ace/llm.js";
import type { AgentStats, DashboardState } from "./types.js";

export class Orchestrator {
  readonly feedStore: FeedStore;
  readonly decisionLog: DecisionLog;
  readonly healthMonitor: HealthMonitor;

  private startedAt: Date;
  private totalScrapes = 0;
  private totalExtractions = 0;
  private totalFeedQueries = 0;
  private isRunning = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.feedStore = new FeedStore();
    this.decisionLog = new DecisionLog();
    this.healthMonitor = new HealthMonitor();
    this.startedAt = new Date();

    // Set up failover handler
    this.healthMonitor.onFailover((sourceId) => {
      this.handleFailover(sourceId);
    });
  }

  /** Start the autonomous scraping loop. */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startedAt = new Date();

    log("info", `Orchestrator started (demo=${DEMO_MODE})`);
    this.decisionLog.addEntry("discovery", `Agent started`);

    // Run first cycle immediately
    void this.runCycle();

    // Schedule recurring cycles
    this.cycleTimer = setInterval(
      () => void this.runCycle(),
      SCRAPE_CONFIG.default_interval_ms,
    );
  }

  /** Stop the scraping loop. */
  stop(): void {
    this.isRunning = false;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    this.feedStore.destroy();
    log("info", "Orchestrator stopped");
  }

  /** Run a single scrape cycle across all enabled sources. */
  async runCycle(): Promise<void> {
    const enabledSources = DATA_SOURCES.filter((s) => s.enabled);
    log("info", `Starting scrape cycle: ${enabledSources.length} sources`);
    this.decisionLog.addEntry("scrape", `Cycle started: ${enabledSources.length} sources`);

    // Process sources with concurrency limit
    const batches = this.chunk(enabledSources, SCRAPE_CONFIG.max_concurrent);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map((source) => this.scrapeSource(source.id)),
      );
    }

    // Log cycle completion
    const kimchi = this.feedStore.getKimchiPremium();
    if (kimchi) {
      this.decisionLog.addEntry("publish", `Kimchi premium: ${kimchi.premium_pct}% (KR: $${kimchi.kr_price_usd} vs US: $${kimchi.us_price_usd})`);
    }

    log("info", `Cycle complete: ${this.feedStore.size} items cached, ${this.totalScrapes} total scrapes`);
  }

  /** Scrape a single source through the full pipeline. */
  async scrapeSource(sourceId: string): Promise<void> {
    const source = DATA_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
      log("warn", `Unknown source: ${sourceId}`);
      return;
    }

    if (!this.healthMonitor.isScrapable(sourceId)) {
      log("debug", `Skipping ${sourceId}: not scrapable (${this.healthMonitor.get(sourceId)?.status})`);
      return;
    }

    try {
      // Step 1: Proxy scraping
      this.decisionLog.addEntry(
        "discovery",
        `SAP discovery: selected ${source.region}-${source.proxy_type} proxy for ${source.name}`,
      );

      const scrapeResult = await scrapeViaProxy(source);
      this.totalScrapes++;

      this.decisionLog.addEntry("scrape", `Scraped ${source.name}: ${scrapeResult.status_code} (${scrapeResult.latency_ms}ms)`);

      if (scrapeResult.cost_usdc > 0) {
        this.decisionLog.addPayment("outflow", scrapeResult.cost_usdc, `proxy-${source.region}`, scrapeResult.x402_tx);
        this.decisionLog.addEntry("payment", `x402 payment: ${scrapeResult.cost_usdc} USDC for proxy access`);
      }

      // Step 2: LLM extraction
      const extraction = await extractWithLLM(
        source,
        scrapeResult.raw_text,
        scrapeResult.proxy_region,
        scrapeResult.cost_usdc,
      );
      this.totalExtractions++;

      this.decisionLog.addEntry(
        "extract",
        `LLM extraction: confidence ${extraction.feed_item.confidence} (${extraction.model_used}, ${extraction.latency_ms}ms)`,
      );

      if (extraction.cost_usdc > 0) {
        this.decisionLog.addPayment("outflow", extraction.cost_usdc, `llm-${extraction.model_used}`, extraction.x402_tx);
        this.decisionLog.addEntry("payment", `x402 payment: ${extraction.cost_usdc} USDC for ${extraction.model_used}`);
      }

      // Step 3: Store in feed cache
      this.feedStore.add(extraction.feed_item);
      this.decisionLog.addEntry("publish", `Feed updated: ${source.id} → cache (confidence: ${extraction.feed_item.confidence})`);

      // Record success
      this.healthMonitor.recordSuccess(sourceId, scrapeResult.latency_ms);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("error", `Pipeline failed for ${sourceId}: ${message}`);
      this.decisionLog.addEntry("error", `Pipeline failed for ${source.name}: ${message}`);
      this.healthMonitor.recordFailure(sourceId, message);
    }
  }

  /** Handle a consumer query and record the payment. */
  recordQuery(queryDescription?: string): void {
    this.totalFeedQueries++;
    const inflow = 0.01; // 0.01 USDC per query
    this.decisionLog.addPayment("inflow", inflow, "feed-query", `mock_inflow_${Date.now().toString(36)}`);
    this.decisionLog.addEntry(
      "publish",
      `Consumer query served: "${queryDescription ?? "feed data"}" (+${inflow} USDC)`,
    );
  }

  /** Handle failover for a down source. */
  private handleFailover(sourceId: string): void {
    this.healthMonitor.markDiscovering(sourceId);
    this.decisionLog.addEntry(
      "failover",
      `Self-healing: re-discovering proxy for ${sourceId} via SAP`,
    );

    // In a real implementation, we'd call client.discovery.findAgentsByCapability()
    // For now, simulate recovery after a delay
    setTimeout(() => {
      const h = this.healthMonitor.get(sourceId);
      if (h) {
        h.status = "healthy";
        h.consecutive_failures = 0;
        this.decisionLog.addEntry("failover", `Recovery complete: ${sourceId} back online via alternative proxy`);
      }
    }, 5_000);
  }

  /** Get current agent stats. */
  getStats(): AgentStats {
    const healthSummary = this.healthMonitor.getSummary();
    return {
      is_active: this.isRunning,
      uptime_seconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      total_scrapes: this.totalScrapes,
      total_extractions: this.totalExtractions,
      total_feed_queries: this.totalFeedQueries,
      total_x402_outflow_usdc: this.decisionLog.getTotalOutflow(),
      total_x402_inflow_usdc: this.decisionLog.getTotalInflow(),
      sources_healthy: healthSummary.healthy,
      sources_degraded: healthSummary.degraded,
      sources_down: healthSummary.down,
      feed_items_cached: this.feedStore.size,
      last_cycle_at: new Date().toISOString(),
      wallet_balance_usdc: 12.45,
    };
  }

  /** Get full dashboard state. */
  getDashboardState(): DashboardState {
    return {
      stats: this.getStats(),
      feed_items: this.feedStore.getAll().slice(0, 50),
      decision_log: this.decisionLog.getEntries(50),
      source_health: this.healthMonitor.getAll(),
      payments: this.decisionLog.getPayments(50),
    };
  }

  /** Split array into chunks. */
  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
