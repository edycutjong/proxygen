// ─── Feed API Server ──────────────────────────────────────────
// Fastify routes exposing feed data and agent stats.
// Includes SSE endpoint for real-time dashboard updates.

import type { FastifyInstance } from "fastify";
import type { Orchestrator } from "../orchestrator.js";

export function registerFeedRoutes(app: FastifyInstance, orchestrator: Orchestrator): void {
  // ─── Health check ───
  app.get("/health", async () => ({
    status: "ok",
    agent: "Proxygen",
    version: "0.1.0",
    is_active: orchestrator.getStats().is_active,
    uptime_seconds: orchestrator.getStats().uptime_seconds,
  }));

  // ─── Full dashboard state ───
  app.get("/api/dashboard", async () => {
    return orchestrator.getDashboardState();
  });

  // ─── Agent stats ───
  app.get("/api/stats", async () => {
    return orchestrator.getStats();
  });

  // ─── Feed items ───
  app.get<{
    Querystring: { source?: string; region?: string; type?: string; limit?: string };
  }>("/api/feeds", async (request) => {
    const { source, region, type, limit } = request.query;
    const maxItems = Math.min(parseInt(limit ?? "50", 10), 100);

    let items = orchestrator.feedStore.getAll();

    if (source) items = items.filter((i) => i.source === source);
    if (region) items = items.filter((i) => i.region === region);
    if (type) items = items.filter((i) => i.type === type);

    items = items.slice(0, maxItems);

    // Record the query
    orchestrator.recordQuery(`feeds?${source ? `source=${source}` : "all"}`);

    return {
      count: items.length,
      items,
      kimchi_premium: orchestrator.feedStore.getKimchiPremium(),
    };
  });

  // ─── Kimchi premium signal ───
  app.get("/api/signals/kimchi", async () => {
    const premium = orchestrator.feedStore.getKimchiPremium();
    orchestrator.recordQuery("kimchi premium signal");
    return {
      signal: "kimchi_premium",
      data: premium,
      sources: orchestrator.feedStore.getByRegion("KR").map((i) => i.source),
      timestamp: new Date().toISOString(),
    };
  });

  // ─── Decision log ───
  app.get<{ Querystring: { limit?: string } }>("/api/log", async (request) => {
    const limit = parseInt(request.query.limit ?? "50", 10);
    return {
      entries: orchestrator.decisionLog.getEntries(limit),
    };
  });

  // ─── Payment records ───
  app.get<{ Querystring: { limit?: string } }>("/api/payments", async (request) => {
    const limit = parseInt(request.query.limit ?? "50", 10);
    return {
      payments: orchestrator.decisionLog.getPayments(limit),
      total_outflow: orchestrator.decisionLog.getTotalOutflow(),
      total_inflow: orchestrator.decisionLog.getTotalInflow(),
      net: Math.round((orchestrator.decisionLog.getTotalInflow() - orchestrator.decisionLog.getTotalOutflow()) * 1_000_000) / 1_000_000,
    };
  });

  // ─── Source health ───
  app.get("/api/sources", async () => {
    return {
      sources: orchestrator.healthMonitor.getAll(),
      summary: orchestrator.healthMonitor.getSummary(),
    };
  });

  // ─── Trigger manual scrape cycle (for demo) ───
  app.post("/api/cycle", async () => {
    void orchestrator.runCycle();
    return { status: "cycle_triggered" };
  });

  // ─── Trigger single source scrape (for demo) ───
  app.post<{ Params: { sourceId: string } }>("/api/scrape/:sourceId", async (request) => {
    const { sourceId } = request.params;
    void orchestrator.scrapeSource(sourceId);
    return { status: "scrape_triggered", source: sourceId };
  });

  // ─── SSE endpoint for real-time updates ───
  app.get("/api/events", async (request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Send initial state
    const state = orchestrator.getDashboardState();
    reply.raw.write(`data: ${JSON.stringify(state)}\n\n`);

    // Push updates every 3 seconds
    const interval = setInterval(() => {
      try {
        const state = orchestrator.getDashboardState();
        reply.raw.write(`data: ${JSON.stringify(state)}\n\n`);
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    // Clean up on disconnect
    request.raw.on("close", () => {
      clearInterval(interval);
    });
  });
}
