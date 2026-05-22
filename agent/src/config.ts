// ─── Proxygen Configuration ───────────────────────────────────
// Environment variables, constants, and configuration.

import "dotenv/config";

/** Whether we're running in demo mode (mock data, no live APIs). */
export let DEMO_MODE = process.env.PROXYGEN_DEMO === "true";
export function updateDemoMode() {
  DEMO_MODE = process.env.PROXYGEN_DEMO === "true";
}

/** Ace Data Cloud configuration. */
export const ACE_CONFIG = {
  /** AceDataCloud SDK doesn't need an API key — x402 payments are the auth. */
  base_url: process.env.ACE_API_URL ?? "https://api.acedata.cloud",
  /** Settlement network for x402 payments. */
  network: (process.env.ACE_NETWORK ?? "solana") as "base" | "solana" | "skale",
} as const;

/** OOBE / SAP configuration. */
export const SAP_CONFIG = {
  rpc_url: process.env.OOBE_RPC_URL ?? "https://api.devnet.solana.com",
  cluster: (process.env.OOBE_CLUSTER ?? "devnet") as "mainnet-beta" | "devnet" | "localnet",
  api_key: process.env.OOBE_API_KEY ?? "",
} as const;

/** Solana wallet configuration. */
export const WALLET_CONFIG = {
  /** Base58-encoded private key for the agent wallet. */
  private_key: process.env.SOLANA_PRIVATE_KEY ?? "",
  /** EVM private key for Base/SKALE x402 (optional). */
  evm_private_key: process.env.EVM_PRIVATE_KEY ?? "",
} as const;

/** Agent identity. */
export const AGENT_IDENTITY = {
  name: "Proxygen",
  description: "Autonomous global data intelligence agent — scrapes geo-restricted data via global proxies, structures with AI, sells clean feeds via x402 micropayments.",
  version: "0.1.0",
  x402_endpoint: process.env.AGENT_X402_ENDPOINT ?? "http://localhost:3001/x402",
} as const;

/** Server configuration. */
export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  host: process.env.HOST ?? "0.0.0.0",
} as const;

/** Scraping configuration. */
export const SCRAPE_CONFIG = {
  /** Default interval between scrape cycles (ms). */
  default_interval_ms: parseInt(process.env.SCRAPE_INTERVAL_MS ?? "600000", 10), // 10 min
  /** Maximum concurrent scrapes. */
  max_concurrent: parseInt(process.env.SCRAPE_MAX_CONCURRENT ?? "3", 10),
  /** Feed item TTL in cache (ms). */
  feed_ttl_ms: parseInt(process.env.FEED_TTL_MS ?? "3600000", 10), // 1 hour
  /** Maximum feed items to keep in cache. */
  max_feed_items: parseInt(process.env.MAX_FEED_ITEMS ?? "500", 10),
} as const;

/** LLM configuration. */
export const LLM_CONFIG = {
  /** Primary model for data extraction. */
  primary_model: process.env.LLM_PRIMARY_MODEL ?? "gpt-4o-mini",
  /** Fallback model for cost optimization. */
  fallback_model: process.env.LLM_FALLBACK_MODEL ?? "deepseek-v3",
  /** Max tokens for extraction responses. */
  max_tokens: parseInt(process.env.LLM_MAX_TOKENS ?? "1000", 10),
} as const;

/** Logging. */
export function log(level: "info" | "warn" | "error" | "debug", msg: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [Proxygen]`;
  if (meta) {
    console.log(`${prefix} ${msg}`, meta);
  } else {
    console.log(`${prefix} ${msg}`);
  }
}
