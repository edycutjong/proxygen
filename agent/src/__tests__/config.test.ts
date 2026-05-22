import { jest } from "@jest/globals";

jest.unstable_mockModule("dotenv/config", () => ({}));

// Set environment variables before importing config
process.env.PROXYGEN_DEMO = "true";
process.env.ACE_API_URL = "https://custom-api.acedata.cloud";
process.env.ACE_NETWORK = "solana";
process.env.OOBE_RPC_URL = "https://api.devnet.solana.com";
process.env.OOBE_CLUSTER = "devnet";
process.env.OOBE_API_KEY = "test_oobe_key";
process.env.SOLANA_PRIVATE_KEY = "test_solana_key";
process.env.EVM_PRIVATE_KEY = "test_evm_key";
process.env.AGENT_X402_ENDPOINT = "http://localhost:3001/x402";
process.env.PORT = "3002";
process.env.HOST = "127.0.0.1";
process.env.SCRAPE_INTERVAL_MS = "120000";
process.env.SCRAPE_MAX_CONCURRENT = "5";
process.env.FEED_TTL_MS = "1800000";
process.env.MAX_FEED_ITEMS = "100";
process.env.LLM_PRIMARY_MODEL = "gpt-4o-custom";
process.env.LLM_FALLBACK_MODEL = "deepseek-custom";
process.env.LLM_MAX_TOKENS = "500";

let config: any;

beforeAll(async () => {
  config = await import("../config.js");
});

describe("config", () => {
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should parse env values correctly", () => {
    expect(config.DEMO_MODE).toBe(true);
    expect(config.ACE_CONFIG.base_url).toBe("https://custom-api.acedata.cloud");
    expect(config.ACE_CONFIG.network).toBe("solana");
    expect(config.SAP_CONFIG.rpc_url).toBe("https://api.devnet.solana.com");
    expect(config.SAP_CONFIG.cluster).toBe("devnet");
    expect(config.SAP_CONFIG.api_key).toBe("test_oobe_key");
    expect(config.WALLET_CONFIG.private_key).toBe("test_solana_key");
    expect(config.WALLET_CONFIG.evm_private_key).toBe("test_evm_key");
    expect(config.AGENT_IDENTITY.x402_endpoint).toBe("http://localhost:3001/x402");
    expect(config.SERVER_CONFIG.port).toBe(3002);
    expect(config.SERVER_CONFIG.host).toBe("127.0.0.1");
    expect(config.SCRAPE_CONFIG.default_interval_ms).toBe(120000);
    expect(config.SCRAPE_CONFIG.max_concurrent).toBe(5);
    expect(config.SCRAPE_CONFIG.feed_ttl_ms).toBe(1800000);
    expect(config.SCRAPE_CONFIG.max_feed_items).toBe(100);
    expect(config.LLM_CONFIG.primary_model).toBe("gpt-4o-custom");
    expect(config.LLM_CONFIG.fallback_model).toBe("deepseek-custom");
    expect(config.LLM_CONFIG.max_tokens).toBe(500);
  });

  it("should fall back to defaults when env is not set", async () => {
    // Save original env values
    const origEnv = { ...process.env };
    // Delete env values
    delete process.env.PROXYGEN_DEMO;
    delete process.env.ACE_API_URL;
    delete process.env.ACE_NETWORK;
    delete process.env.OOBE_RPC_URL;
    delete process.env.OOBE_CLUSTER;
    delete process.env.OOBE_API_KEY;
    delete process.env.SOLANA_PRIVATE_KEY;
    delete process.env.EVM_PRIVATE_KEY;
    delete process.env.AGENT_X402_ENDPOINT;
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.SCRAPE_INTERVAL_MS;
    delete process.env.SCRAPE_MAX_CONCURRENT;
    delete process.env.FEED_TTL_MS;
    delete process.env.MAX_FEED_ITEMS;
    delete process.env.LLM_PRIMARY_MODEL;
    delete process.env.LLM_FALLBACK_MODEL;
    delete process.env.LLM_MAX_TOKENS;

    jest.resetModules();
    // @ts-ignore
    const configDefault = await import("../config.js?default");

    expect(configDefault.DEMO_MODE).toBe(false);
    expect(configDefault.SERVER_CONFIG.port).toBe(3001);
    expect(configDefault.SERVER_CONFIG.host).toBe("0.0.0.0");
    expect(configDefault.SCRAPE_CONFIG.max_concurrent).toBe(3);

    // Restore env values
    Object.assign(process.env, origEnv);
  });

  it("should log message without meta", () => {
    config.log("info", "Hello test log");
    expect(consoleSpy).toHaveBeenCalled();
    const lastCall = consoleSpy.mock.calls[0]?.[0] as string;
    expect(lastCall).toContain("[INFO] [Proxygen] Hello test log");
  });

  it("should log message with meta", () => {
    const meta = { foo: "bar" };
    config.log("error", "Hello test error", meta);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR] [Proxygen] Hello test error"),
      meta
    );
  });
});
