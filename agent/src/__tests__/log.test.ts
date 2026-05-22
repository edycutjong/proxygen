import { DecisionLog } from "../feeds/log.js";

describe("DecisionLog", () => {
  let log: DecisionLog;

  beforeEach(() => {
    log = new DecisionLog();
  });

  it("should add and retrieve log entries up to limit", () => {
    const entry = log.addEntry("discovery", "SAP agent discovery started", { cluster: "devnet" });
    expect(entry.type).toBe("discovery");
    expect(entry.message).toBe("SAP agent discovery started");
    expect(entry.metadata).toEqual({ cluster: "devnet" });

    // Test max limit by adding 205 entries
    for (let i = 0; i < 205; i++) {
      log.addEntry("scrape", `Scrape entry ${i}`);
    }

    const entries = log.getEntries(300);
    expect(entries.length).toBe(200); // capped at MAX_ENTRIES (200)
    expect(entries[0]?.message).toBe("Scrape entry 204"); // unshifted, so newest is first

    const defaultEntries = log.getEntries();
    expect(defaultEntries.length).toBe(50);
  });

  it("should add and retrieve payments up to limit", () => {
    const payment = log.addPayment("outflow", 0.05, "proxy-kr", "tx_hash_val");
    expect(payment.direction).toBe("outflow");
    expect(payment.amount_usdc).toBe(0.05);
    expect(payment.service).toBe("proxy-kr");
    expect(payment.tx_hash).toBe("tx_hash_val");
    expect(payment.status).toBe("settled");

    // Payment without tx_hash is pending
    const pendingPayment = log.addPayment("inflow", 0.01, "feed-query");
    expect(pendingPayment.status).toBe("pending");

    // Test max limit of 500
    for (let i = 0; i < 505; i++) {
      log.addPayment("outflow", 0.01, "test");
    }

    const payments = log.getPayments(600);
    expect(payments.length).toBe(500); // capped at MAX_PAYMENTS

    const defaultPayments = log.getPayments();
    expect(defaultPayments.length).toBe(50);
  });

  it("should calculate total inflow and outflow", () => {
    log.addPayment("outflow", 0.05, "proxy-kr", "tx1");
    log.addPayment("outflow", 0.02, "llm-gpt4o", "tx2");
    log.addPayment("outflow", 0.10, "llm-failed"); // pending, so shouldn't count in settled
    
    log.addPayment("inflow", 0.01, "feed-query", "tx3");
    log.addPayment("inflow", 0.01, "feed-query", "tx4");
    log.addPayment("inflow", 0.05, "feed-query"); // pending

    expect(log.getTotalOutflow()).toBe(0.07);
    expect(log.getTotalInflow()).toBe(0.02);
  });
});
