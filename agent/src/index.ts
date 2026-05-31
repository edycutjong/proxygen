// ─── Proxygen Agent Entry Point ────────────────────────────────
// Main entry: starts Fastify server + autonomous scraping loop.

import Fastify from "fastify";
import cors from "@fastify/cors";
import { SERVER_CONFIG, AGENT_IDENTITY, log } from "./config.js";
import { Orchestrator } from "./orchestrator.js";
import { registerFeedRoutes } from "./feeds/api.js";

async function main(): Promise<void> {
  // ─── Banner ───
  log("info", `
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🧪  P R O X Y G E N  v${AGENT_IDENTITY.version}                          ║
  ║   Autonomous Global Data Intelligence Agent               ║
  ║                                                           ║
  ║   Mode: ${process.env.PROXYGEN_DEMO === "true" ? "🎭 DEMO (mock data)" : "🔴 LIVE (real APIs)"}                           ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // ─── Initialize Fastify ───
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true, // Allow all origins for development
    methods: ["GET", "POST", "OPTIONS"],
  });

  // ─── Initialize Orchestrator ───
  const orchestrator = new Orchestrator();

  // ─── Register API Routes ───
  registerFeedRoutes(app, orchestrator);

  // ─── Start Server ───
  try {
    await app.listen({
      port: SERVER_CONFIG.port,
      host: SERVER_CONFIG.host,
    });
    log("info", `API server listening on http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
    log("info", `Dashboard SSE: http://localhost:${SERVER_CONFIG.port}/api/events`);
    log("info", `Health: http://localhost:${SERVER_CONFIG.port}/health`);
  } catch (err) {
    log("error", `Failed to start server: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // ─── Start Autonomous Loop ───
  orchestrator.start();

  // ─── Graceful Shutdown ───
  const shutdown = async (): Promise<void> => {
    log("info", "Shutting down...");
    orchestrator.stop();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  log("error", `Fatal error: ${String(err)}`);
  process.exit(1);
});
