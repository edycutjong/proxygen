/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://proxygen.edycu.dev/"}
 */

import { jest } from "@jest/globals";

describe("types configuration in production environment", () => {
  const originalEnv = process.env.NEXT_PUBLIC_AGENT_API_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_AGENT_API_URL = originalEnv;
  });

  it("should use production endpoint when window is defined and hostname is not localhost", async () => {
    delete process.env.NEXT_PUBLIC_AGENT_API_URL;
    
    await new Promise<void>((resolve, reject) => {
      jest.isolateModules(async () => {
        try {
          // @ts-expect-error - Query parameter is used to bust Jest module cache
          const { AGENT_API_URL } = await import("../lib/types?cb=4");
          expect(AGENT_API_URL).toBe("https://api.proxygen.edycu.dev");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
