// ─── Dashboard Types ──────────────────────────────────────────
// Mirrors agent types for the dashboard.

export interface ProxygenFeedItem {
  id: string;
  source: string;
  region: string;
  type: "price" | "sentiment" | "volume" | "alert";
  data: {
    symbol?: string;
    price?: number;
    volume_24h?: number;
    sentiment_score?: number;
    raw_text?: string;
  };
  confidence: number;
  proxy_region: string;
  cost_usdc: number;
  timestamp: string;
  x402_tx?: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  type: "discovery" | "scrape" | "extract" | "payment" | "failover" | "publish" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SourceHealth {
  source_id: string;
  status: "healthy" | "degraded" | "down" | "discovering";
  last_scrape: string | null;
  last_error: string | null;
  success_rate: number;
  avg_latency_ms: number;
  consecutive_failures: number;
}

export interface PaymentRecord {
  id: string;
  timestamp: string;
  direction: "outflow" | "inflow";
  amount_usdc: number;
  service: string;
  tx_hash?: string;
  status: "pending" | "settled" | "failed";
}

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

export interface DashboardState {
  stats: AgentStats;
  feed_items: ProxygenFeedItem[];
  decision_log: DecisionLogEntry[];
  source_health: SourceHealth[];
  payments: PaymentRecord[];
}

/** Agent API base URL */
export const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL ?? 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" 
    ? "https://api.proxygen.edycu.dev" 
    : "http://localhost:3001");
