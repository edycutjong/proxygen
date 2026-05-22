import { DATA_SOURCES } from "../sources.js";

describe("sources", () => {
  it("should export DATA_SOURCES array with 10 elements", () => {
    expect(Array.isArray(DATA_SOURCES)).toBe(true);
    expect(DATA_SOURCES.length).toBe(10);
  });

  it("should have correct properties on each source", () => {
    for (const source of DATA_SOURCES) {
      expect(source).toHaveProperty("id");
      expect(source).toHaveProperty("name");
      expect(source).toHaveProperty("url");
      expect(source).toHaveProperty("region");
      expect(source).toHaveProperty("proxy_type");
      expect(source).toHaveProperty("geo_restricted");
      expect(source).toHaveProperty("data_type");
      expect(source).toHaveProperty("extraction_prompt");
      expect(source).toHaveProperty("scrape_interval_ms");
      expect(source).toHaveProperty("enabled");
      expect(typeof source.enabled).toBe("boolean");
    }
  });

  it("should have correct prompt text references", () => {
    const upbit = DATA_SOURCES.find((s) => s.id === "upbit-kr");
    expect(upbit?.extraction_prompt).toContain("financial data extraction engine");
    
    const naver = DATA_SOURCES.find((s) => s.id === "naver-kr");
    expect(naver?.extraction_prompt).toContain("sentiment analysis engine");
  });
});
