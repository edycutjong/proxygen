import { jest } from "@jest/globals";

describe("types configuration", () => {
  const originalEnv = process.env.NEXT_PUBLIC_AGENT_API_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_AGENT_API_URL = originalEnv;
  });

  it("should use NEXT_PUBLIC_AGENT_API_URL when it is set", async () => {
    process.env.NEXT_PUBLIC_AGENT_API_URL = "http://custom-env-agent:3002";
    // Using isolateModules to re-evaluate the module imports within a clean module registry context
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          // @ts-expect-error - Query parameter is used to bust Jest module cache
          const { AGENT_API_URL } = await import("../lib/types?cb=1");
          expect(AGENT_API_URL).toBe("http://custom-env-agent:3002");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });

  it("should fallback to localhost:3001 when NEXT_PUBLIC_AGENT_API_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_AGENT_API_URL;
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          // @ts-expect-error - Query parameter is used to bust Jest module cache
          const { AGENT_API_URL } = await import("../lib/types?cb=2");
          expect(AGENT_API_URL).toBe("http://localhost:3001");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
