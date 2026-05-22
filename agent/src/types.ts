// ─── Proxygen Types ───────────────────────────────────────────
// Shared TypeScript interfaces for the autonomous data intelligence agent.

/** A structured data item produced by the scrape → extract pipeline. */
export interface ProxygenFeedItem {
  id: string;
  source: string;          // e.g., "upbit-kr", "binance-us"
  region: string;          // e.g., "KR", "US", "EU"
  type: "price" | "sentiment" | "volume" | "alert";
  data: {
    symbol?: string;       // e.g., "BTC/KRW"
    price?: number;
    volume_24h?: number;
    sentiment_score?: number;  // -1.0 to 1.0
    raw_text?: string;
  };
  confidence: number;      // 0.0 to 1.0
  proxy_region: string;    // which proxy was used
  cost_usdc: number;       // x402 cost to produce this item
  timestamp: string;       // ISO 8601
  x402_tx?: string;        // settlement tx hash (if settled)
}

/** Configuration for a data source to scrape. */
export interface DataSource {
  id: string;
  name: string;
  url: string;
  region: string;
  proxy_type: "residential" | "mobile" | "datacenter";
  geo_restricted: boolean;
  data_type: "price" | "sentiment" | "volume";
  extraction_prompt: string;
  scrape_interval_ms: number;
  enabled: boolean;
}

/** Agent decision log entry. */
export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  type: "discovery" | "scrape" | "extract" | "payment" | "failover" | "publish" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

/** Health status of a data source. */
export interface SourceHealth {
  source_id: string;
  status: "healthy" | "degraded" | "down" | "discovering";
  last_scrape: string | null;
  last_error: string | null;
  success_rate: number;  // 0.0 to 1.0 over last 10 attempts
  avg_latency_ms: number;
  consecutive_failures: number;
}

/** x402 payment record. */
export interface PaymentRecord {
  id: string;
  timestamp: string;
  direction: "outflow" | "inflow";
  amount_usdc: number;
  service: string;       // e.g., "proxy-kr", "llm-gpt4o", "feed-query"
  tx_hash?: string;
  status: "pending" | "settled" | "failed";
}

/** Agent stats for dashboard. */
export interface AgentStats {
  is_active: boolean;
  uptime_seconds: number;
  total_scrapes: number;
  total_extractions: number;
  total_feed_queries: number;
  total_x402_outflow_usdc: number;
  total_x402_inflow_usdc: number;
  sources_healthy: number;
  sources_degraded: number;
  sources_down: number;
  feed_items_cached: number;
  last_cycle_at: string | null;
  wallet_balance_usdc?: number;
}

/** Full dashboard state pushed via SSE. */
export interface DashboardState {
  stats: AgentStats;
  feed_items: ProxygenFeedItem[];
  decision_log: DecisionLogEntry[];
  source_health: SourceHealth[];
  payments: PaymentRecord[];
}
