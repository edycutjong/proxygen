import { HealthMonitor } from "../health/monitor.js";
import { DATA_SOURCES } from "../sources.js";

describe("HealthMonitor", () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  it("should initialize with healthy status for enabled sources", () => {
    const all = monitor.getAll();
    const enabledCount = DATA_SOURCES.filter((s) => s.enabled).length;
    expect(all.length).toBe(enabledCount);

    const first = all[0];
    expect(first?.status).toBe("healthy");
    expect(first?.success_rate).toBe(1.0);
    expect(first?.consecutive_failures).toBe(0);
    expect(first?.avg_latency_ms).toBe(0);
  });

  it("should record success and calculate latency EWMA", () => {
    const sourceId = "upbit-kr";
    
    // First success setting avg_latency_ms
    monitor.recordSuccess(sourceId, 100);
    let h = monitor.get(sourceId);
    expect(h?.consecutive_failures).toBe(0);
    expect(h?.avg_latency_ms).toBe(100);
    expect(h?.success_rate).toBe(1.0);
    expect(h?.status).toBe("healthy");

    // Second success, avg_latency_ms EWMA: 100 * 0.8 + 200 * 0.2 = 120
    monitor.recordSuccess(sourceId, 200);
    h = monitor.get(sourceId);
    expect(h?.avg_latency_ms).toBe(120);

    // Call recordSuccess on non-existent source
    monitor.recordSuccess("non-existent", 100);
    expect(monitor.get("non-existent")).toBeUndefined();
  });

  it("should record failure and trigger failover", () => {
    const sourceId = "upbit-kr";
    const failoverSources: string[] = [];
    
    monitor.onFailover((id) => {
      failoverSources.push(id);
    });

    // 1st failure
    monitor.recordFailure(sourceId, "timeout");
    let h = monitor.get(sourceId);
    expect(h?.consecutive_failures).toBe(1);
    expect(h?.last_error).toBe("timeout");
    expect(h?.status).toBe("degraded");
    expect(failoverSources).toEqual([]);

    // 2nd failure
    monitor.recordFailure(sourceId, "500 error");
    expect(monitor.get(sourceId)?.status).toBe("degraded");

    // 3rd failure (triggers failover)
    monitor.recordFailure(sourceId, "connection refused");
    h = monitor.get(sourceId);
    expect(h?.status).toBe("down");
    expect(h?.consecutive_failures).toBe(3);
    expect(failoverSources).toEqual([sourceId]);

    // Call recordFailure on non-existent source
    monitor.recordFailure("non-existent", "error");
    expect(monitor.get("non-existent")).toBeUndefined();
  });

  it("should handle discovering state and scrapability check", () => {
    const sourceId = "upbit-kr";
    expect(monitor.isScrapable(sourceId)).toBe(true);

    monitor.markDiscovering(sourceId);
    expect(monitor.get(sourceId)?.status).toBe("discovering");
    expect(monitor.isScrapable(sourceId)).toBe(false);

    // If source is DOWN
    // Trigger 3 failures
    monitor.recordFailure(sourceId, "err");
    monitor.recordFailure(sourceId, "err");
    monitor.recordFailure(sourceId, "err");
    expect(monitor.isScrapable(sourceId)).toBe(false);

    // Non-existent source is not scrapable
    expect(monitor.isScrapable("non-existent")).toBe(false);

    // Mark discovering on non-existent source
    monitor.markDiscovering("non-existent");
    expect(monitor.get("non-existent")).toBeUndefined();
  });

  it("should return summary counts", () => {
    const summaryBefore = monitor.getSummary();
    expect(summaryBefore.healthy).toBeGreaterThan(0);
    expect(summaryBefore.degraded).toBe(0);
    expect(summaryBefore.down).toBe(0);
    expect(summaryBefore.discovering).toBe(0);

    // degrade one, down one, discovering one
    const sources = DATA_SOURCES.filter((s) => s.enabled);
    const s1 = sources[0]!.id;
    const s2 = sources[1]!.id;
    const s3 = sources[2]!.id;

    monitor.recordFailure(s1, "err"); // degraded
    
    monitor.recordFailure(s2, "err"); // down (needs 3 failures)
    monitor.recordFailure(s2, "err");
    monitor.recordFailure(s2, "err");

    monitor.markDiscovering(s3); // discovering

    const summaryAfter = monitor.getSummary();
    expect(summaryAfter.degraded).toBe(1);
    expect(summaryAfter.down).toBe(1);
    expect(summaryAfter.discovering).toBe(1);
  });

  it("should mark status as degraded on success if success rate remains <= 0.8", () => {
    const sourceId = "upbit-kr";
    // 3 failures to drop success rate to 0.729 and consecutive failures to 3 (down)
    monitor.recordFailure(sourceId, "err");
    monitor.recordFailure(sourceId, "err");
    monitor.recordFailure(sourceId, "err");
    expect(monitor.get(sourceId)?.status).toBe("down");

    // 1 success: success rate goes to 0.729 * 0.9 + 0.1 = 0.7561 (<= 0.8)
    monitor.recordSuccess(sourceId, 100);
    const h = monitor.get(sourceId);
    expect(h?.status).toBe("degraded");
    expect(h?.consecutive_failures).toBe(0);
  });
});
