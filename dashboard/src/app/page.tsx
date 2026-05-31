"use client";

import { useState, useEffect } from "react";
import type { DashboardState, ProxygenFeedItem, DecisionLogEntry, SourceHealth, PaymentRecord, AgentStats } from "@/lib/types";
import { AGENT_API_URL } from "@/lib/types";

// ─── Region flag map ─────────────────────────────────────────
const REGION_FLAGS: Record<string, string> = { KR: "🇰🇷", CN: "🇨🇳", US: "🇺🇸", EU: "🇪🇺", JP: "🇯🇵", SG: "🇸🇬" };

// ─── Formatters ──────────────────────────────────────────────
function formatPrice(price: number | undefined, region: string): string {
  if (!price) return "—";
  if (region === "KR") return `₩${(price / 1_000_000).toFixed(1)}M`;
  if (region === "CN") return `¥${price.toLocaleString()}`;
  if (region === "JP") return `¥${(price / 10_000).toFixed(1)}万`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatUSDC(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return "text-[var(--color-accent-green)]";
  if (c >= 0.7) return "text-[var(--color-accent-amber)]";
  return "text-[var(--color-accent-red)]";
}

function typeColor(type: DecisionLogEntry["type"]): string {
  switch (type) {
    case "discovery": return "badge-cyan";
    case "scrape": return "badge-cyan";
    case "extract": return "badge-green";
    case "payment": return "badge-amber";
    case "failover": return "badge-red";
    case "publish": return "badge-green";
    case "error": return "badge-red";
    default: return "badge-cyan";
  }
}

// ─── Header Component ────────────────────────────────────────
function Header({ stats }: { stats: AgentStats | null }) {
  return (
    <header className="glass-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/icon.svg" alt="Proxygen Logo" className="w-full h-full" />
          </div>
          <h1 className="font-orbitron text-lg font-bold tracking-wider text-[var(--color-text-primary)]">
            PROXYGEN
          </h1>
        </div>
        <span className="text-xs text-[var(--color-text-muted)] font-mono-data">v0.1.0</span>
      </div>

      <div className="flex items-center gap-6">
        {stats && (
          <>
            <div className="flex items-center gap-2">
              <span className={`status-dot ${stats.is_active ? "healthy" : "down"}`} />
              <span className="text-xs font-semibold tracking-wider text-[var(--color-text-secondary)]">
                {stats.is_active ? "ACTIVE" : "OFFLINE"}
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              ↑ {formatUptime(stats.uptime_seconds)}
            </div>
            <div className="font-mono-data text-sm font-semibold text-[var(--color-accent-cyan)]">
              {stats.wallet_balance_usdc?.toFixed(2) ?? "—"} USDC
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────
function StatsBar({ stats }: { stats: AgentStats }) {
  const net = stats.total_x402_inflow_usdc - stats.total_x402_outflow_usdc;
  const netColor = net >= 0 ? "text-[var(--color-accent-green)]" : "text-[var(--color-accent-red)]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {[
        { label: "Scrapes", value: stats.total_scrapes.toString(), icon: "🔄" },
        { label: "Extractions", value: stats.total_extractions.toString(), icon: "🧠" },
        { label: "Feed Queries", value: stats.total_feed_queries.toString(), icon: "📊" },
        { label: "Cached Items", value: stats.feed_items_cached.toString(), icon: "💾" },
        { label: "Outflow", value: `$${stats.total_x402_outflow_usdc.toFixed(3)}`, icon: "📤", color: "text-[var(--color-accent-red)]" },
        { label: "Inflow", value: `$${stats.total_x402_inflow_usdc.toFixed(3)}`, icon: "📥", color: "text-[var(--color-accent-green)]" },
        { label: "Net P&L", value: net >= 0 ? `+$${net.toFixed(3)}` : `-$${Math.abs(net).toFixed(3)}`, icon: "💹", color: netColor },
      ].map((stat) => (
        <div key={stat.label} className="glass-card p-3 flex flex-col items-center text-center">
          <span className="text-lg mb-1">{stat.icon}</span>
          <span className={`font-mono-data text-sm font-semibold ${stat.color ?? "text-[var(--color-text-primary)]"}`}>
            {stat.value}
          </span>
          <span className="text-[0.6rem] uppercase tracking-widest text-[var(--color-text-muted)] mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Feed Table ──────────────────────────────────────────────
function FeedTable({ items }: { items: ProxygenFeedItem[] }) {
  return (
    <div className="glass-card p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-orbitron text-xs font-bold tracking-widest text-[var(--color-accent-cyan)]">
          LIVE FEEDS
        </h2>
        <span className="badge badge-cyan">{items.length} items</span>
      </div>
      <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
        <table className="data-table">
          <thead className="sticky top-0 bg-[var(--color-bg-card)]">
            <tr>
              <th>Source</th>
              <th>Region</th>
              <th>Type</th>
              <th>Price / Value</th>
              <th>Confidence</th>
              <th>Cost</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="animate-fade-in">
                <td className="font-semibold">{item.source}</td>
                <td>
                  <span className="mr-1">{REGION_FLAGS[item.region] ?? "🌍"}</span>
                  <span className="text-[var(--color-text-secondary)]">{item.region}</span>
                </td>
                <td>
                  <span className={`badge ${item.type === "price" ? "badge-cyan" : item.type === "sentiment" ? "badge-amber" : "badge-green"}`}>
                    {item.type}
                  </span>
                </td>
                <td>
                  {item.type === "price"
                    ? formatPrice(item.data.price, item.region)
                    : item.data.sentiment_score !== undefined
                      ? `${item.data.sentiment_score > 0 ? "+" : ""}${item.data.sentiment_score.toFixed(2)}`
                      : "—"
                  }
                </td>
                <td className={confidenceColor(item.confidence)}>
                  {(item.confidence * 100).toFixed(0)}%
                </td>
                <td className="text-[var(--color-accent-amber)]">
                  {formatUSDC(item.cost_usdc)}
                </td>
                <td className="text-[var(--color-text-muted)]">
                  {formatTime(item.timestamp)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                  Waiting for first scrape cycle...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Decision Log ────────────────────────────────────────────
function DecisionLogPanel({ entries }: { entries: DecisionLogEntry[] }) {
  return (
    <div className="glass-card p-4 overflow-hidden">
      <h2 className="font-orbitron text-xs font-bold tracking-widest text-[var(--color-accent-cyan)] mb-3">
        AGENT DECISION LOG
      </h2>
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 text-xs animate-fade-in"
          >
            <span className="font-mono-data text-[var(--color-text-muted)] shrink-0 w-16">
              {formatTime(entry.timestamp)}
            </span>
            <span className={`badge ${typeColor(entry.type)} shrink-0`}>
              {entry.type}
            </span>
            <span className="text-[var(--color-text-secondary)] truncate">
              {entry.message}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-4 text-[var(--color-text-muted)] text-xs">
            No decisions yet...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Source Health ────────────────────────────────────────────
function SourceHealthPanel({ sources }: { sources: SourceHealth[] }) {
  return (
    <div className="glass-card p-4">
      <h2 className="font-orbitron text-xs font-bold tracking-widest text-[var(--color-accent-cyan)] mb-3">
        SOURCE HEALTH
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {sources.map((src) => {
          const sourceId = src.source_id;
          const regionCode = sourceId.split("-").pop()?.toUpperCase() ?? "";
          const flag = REGION_FLAGS[regionCode] ?? "🌍";

          return (
            <div
              key={sourceId}
              className="glass-card glass-card-hover p-3 flex flex-col items-center text-center transition-all duration-200"
            >
              <span className="text-lg mb-1">{flag}</span>
              <span className="font-mono-data text-[0.7rem] font-semibold text-[var(--color-text-primary)] mb-1">
                {sourceId.split("-")[0]}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`status-dot ${src.status}`} />
                <span className="text-[0.6rem] uppercase tracking-wider text-[var(--color-text-muted)]">
                  {src.status}
                </span>
              </div>
              <span className="font-mono-data text-[0.6rem] text-[var(--color-text-muted)] mt-1">
                {src.avg_latency_ms}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── P&L Tracker ─────────────────────────────────────────────
function PnLTracker({ payments, stats }: { payments: PaymentRecord[]; stats: AgentStats }) {
  const outflow = stats.total_x402_outflow_usdc;
  const inflow = stats.total_x402_inflow_usdc;
  const net = inflow - outflow;
  const maxVal = Math.max(outflow, inflow, 0.001);

  return (
    <div className="glass-card p-4">
      <h2 className="font-orbitron text-xs font-bold tracking-widest text-[var(--color-accent-cyan)] mb-3">
        ECONOMICS
      </h2>

      {/* Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-[0.65rem] mb-1">
            <span className="text-[var(--color-accent-red)] uppercase tracking-wider font-semibold">Spend</span>
            <span className="font-mono-data text-[var(--color-accent-red)]">${outflow.toFixed(4)}</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700"
              style={{ width: `${(outflow / maxVal) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[0.65rem] mb-1">
            <span className="text-[var(--color-accent-green)] uppercase tracking-wider font-semibold">Revenue</span>
            <span className="font-mono-data text-[var(--color-accent-green)]">${inflow.toFixed(4)}</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${(inflow / maxVal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Net */}
      <div className="text-center py-2 glass-card">
        <div className="text-[0.6rem] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Net</div>
        <div className={`font-mono-data text-xl font-bold ${net >= 0 ? "text-[var(--color-accent-green)]" : "text-[var(--color-accent-red)]"}`}>
          {net >= 0 ? `+$${net.toFixed(4)}` : `-$${Math.abs(net).toFixed(4)}`}
        </div>
      </div>

      {/* Recent payments */}
      <div className="mt-3 space-y-1 max-h-[140px] overflow-y-auto">
        {payments.slice(0, 10).map((p) => (
          <div key={p.id} className="flex items-center justify-between text-[0.65rem]">
            <div className="flex items-center gap-2">
              <span className={p.direction === "outflow" ? "text-[var(--color-accent-red)]" : "text-[var(--color-accent-green)]"}>
                {p.direction === "outflow" ? "▼" : "▲"}
              </span>
              <span className="text-[var(--color-text-secondary)]">{p.service}</span>
            </div>
            <span className={`font-mono-data ${p.direction === "outflow" ? "text-[var(--color-accent-red)]" : "text-[var(--color-accent-green)]"}`}>
              {p.direction === "outflow" ? "-" : "+"}${p.amount_usdc.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kimchi Premium Banner ───────────────────────────────────
function KimchiPremiumBanner({ items }: { items: ProxygenFeedItem[] }) {
  // Calculate from feed items
  const krItems = items.filter((i) => i.region === "KR" && i.type === "price" && i.data.price);
  const usItems = items.filter((i) => i.region === "US" && i.type === "price" && i.data.price);

  if (krItems.length === 0 || usItems.length === 0) return null;

  const krPrice = krItems[0]!.data.price!;
  const usPrice = usItems[0]!.data.price!;
  const krPriceUsd = krPrice / 1320;
  const premium = ((krPriceUsd - usPrice) / usPrice) * 100;

  if (isNaN(premium)) return null;

  return (
    <div className={`glass-card p-3 flex items-center justify-between animate-pulse-glow`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="font-orbitron text-xs font-bold tracking-wider text-[var(--color-accent-cyan)]">
            KIMCHI PREMIUM SIGNAL
          </div>
          <div className="text-[0.65rem] text-[var(--color-text-secondary)]">
            BTC price gap between Korean and US exchanges
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono-data text-2xl font-bold ${premium > 0 ? "text-[var(--color-accent-green)]" : "text-[var(--color-accent-red)]"}`}>
          {premium > 0 ? "+" : ""}{premium.toFixed(1)}%
        </div>
        <div className="font-mono-data text-[0.6rem] text-[var(--color-text-muted)]">
          KR: ${krPriceUsd.toFixed(0)} • US: ${usPrice.toFixed(0)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function DashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`${AGENT_API_URL}/api/dashboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: DashboardState = await res.json();
        if (active) {
          setState(data);
          setError(null);
          setIsConnected(true);
        }
      } catch {
        if (active) {
          setError("Cannot connect to agent. Make sure the agent is running on port 3001.");
          setIsConnected(false);
        }
      }
    }

    // Initial fetch
    poll();

    // Poll every 3 seconds
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="flex-1 p-4 space-y-4 max-w-[1800px] mx-auto w-full">
      <Header stats={state?.stats ?? null} />

      {error && !state && (
        <div className="glass-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <img src="/icon.svg" alt="Proxygen Icon" className="w-16 h-16" />
          </div>
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-accent-cyan)] mb-2">
            PROXYGEN
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Intelligence Command Center
          </p>
          <div className="glass-card p-4 max-w-md mx-auto">
            <p className="text-[var(--color-accent-amber)] text-xs mb-2">⚠ Agent not connected</p>
            <p className="text-[var(--color-text-muted)] text-xs">
              {error}
            </p>
            <code className="block mt-2 text-[0.65rem] text-[var(--color-accent-cyan)] font-mono-data bg-[var(--color-bg-primary)] p-2 rounded">
              cd agent && PROXYGEN_DEMO=true npm run dev
            </code>
          </div>
        </div>
      )}

      {state && (
        <>
          {/* Stats Bar */}
          <StatsBar stats={state.stats} />

          {/* Kimchi Premium */}
          <KimchiPremiumBanner items={state.feed_items} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Feed Table (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <FeedTable items={state.feed_items} />
              <DecisionLogPanel entries={state.decision_log} />
            </div>

            {/* Right: Economics + Sources (1 col) */}
            <div className="space-y-4">
              <PnLTracker payments={state.payments} stats={state.stats} />
              <SourceHealthPanel sources={state.source_health} />
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="text-center py-3 text-[0.6rem] text-[var(--color-text-muted)]">
        <span className="font-orbitron tracking-wider">PROXYGEN</span>
        {" "}
        <span>— Autonomous Global Data Intelligence Agent</span>
        {isConnected && (
          <span className="ml-2">• <span className="text-[var(--color-accent-green)]">●</span> Connected</span>
        )}
      </footer>
    </main>
  );
}
