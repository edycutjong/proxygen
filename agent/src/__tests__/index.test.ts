import { jest } from "@jest/globals";

const mockListen = jest.fn() as any;
const mockRegister = jest.fn().mockImplementation(() => Promise.resolve()) as any;
const mockClose = jest.fn().mockImplementation(() => Promise.resolve()) as any;
const mockFastifyInstance = {
  register: mockRegister,
  listen: mockListen,
  close: mockClose,
};
const mockFastify = jest.fn().mockReturnValue(mockFastifyInstance);
jest.unstable_mockModule("fastify", () => ({
  default: mockFastify,
}));

jest.unstable_mockModule("@fastify/cors", () => ({
  default: jest.fn(),
}));

const mockOrchestratorStart = jest.fn();
const mockOrchestratorStop = jest.fn();
const mockOrchestratorInstance = {
  start: mockOrchestratorStart,
  stop: mockOrchestratorStop,
};
const mockOrchestrator = jest.fn().mockReturnValue(mockOrchestratorInstance);
jest.unstable_mockModule("../orchestrator.js", () => ({
  Orchestrator: mockOrchestrator,
}));

const mockRegisterFeedRoutes = jest.fn();
jest.unstable_mockModule("../feeds/api.js", () => ({
  registerFeedRoutes: mockRegisterFeedRoutes,
}));

const mockLog = jest.fn();
jest.unstable_mockModule("../config.js", () => ({
  SERVER_CONFIG: { host: "127.0.0.1", port: 3001 },
  get DEMO_MODE() { return process.env.PROXYGEN_DEMO === "true"; },
  AGENT_IDENTITY: { version: "0.1.0" },
  log: mockLog,
}));

describe("Agent Entrypoint (index.ts)", () => {
  const originalExit = process.exit;
  const originalOn = process.on;
  let mockExit: any;
  let mockOn: any;
  let onHandlers: Record<string, Function>;

  beforeAll(() => {
    mockExit = jest.fn();
    mockOn = jest.fn().mockImplementation((event: unknown, handler: unknown) => {
      onHandlers[event as string] = handler as Function;
    });
    process.exit = mockExit as any;
    process.on = mockOn as any;
  });

  afterAll(() => {
    process.exit = originalExit;
    process.on = originalOn;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    onHandlers = {};
    mockListen.mockReset();
    mockRegister.mockReset();
    mockRegister.mockImplementation(() => Promise.resolve());
    process.env.PROXYGEN_DEMO = "true";
  });

  it("should start fastify server and orchestrator successfully", async () => {
    mockListen.mockResolvedValue("");

    // Import module, running main()
    await import("../index.js");

    expect(mockFastify).toHaveBeenCalled();
    expect(mockRegister).toHaveBeenCalled();
    expect(mockRegisterFeedRoutes).toHaveBeenCalledWith(mockFastifyInstance, mockOrchestratorInstance);
    expect(mockListen).toHaveBeenCalledWith({ port: 3001, host: "127.0.0.1" });
    expect(mockOrchestratorStart).toHaveBeenCalled();

    // Verify signal handlers are registered
    expect(mockOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));

    // Test SIGINT/SIGTERM shutdown handler
    const sigintHandler = onHandlers["SIGINT"];
    expect(sigintHandler).toBeDefined();

    await sigintHandler?.();
    expect(mockOrchestratorStop).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);

    const sigtermHandler = onHandlers["SIGTERM"];
    expect(sigtermHandler).toBeDefined();
    await sigtermHandler?.();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should exit process with code 1 if fastify fails to listen", async () => {
    mockListen.mockRejectedValue(new Error("Port in use"));

    // Bypass ESM cache using dynamic query parameter
    // @ts-ignore
    await import("../index.js?error");

    expect(mockListen).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should exit process with code 1 if fastify fails with a non-Error string", async () => {
    mockListen.mockRejectedValue("Port in use string error");

    // Bypass ESM cache using dynamic query parameter
    // @ts-ignore
    await import("../index.js?rawstringerror");

    expect(mockListen).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should exit process with code 1 if a fatal error occurs in main", async () => {
    mockRegister.mockRejectedValue(new Error("Registration failed"));

    // Bypass ESM cache using dynamic query parameter
    // @ts-ignore
    await import("../index.js?fatal");

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should run in live mode if DEMO_MODE is false", async () => {
    process.env.PROXYGEN_DEMO = "false";
    mockListen.mockResolvedValue("");

    // @ts-ignore
    await import("../index.js?livemode");

    expect(mockListen).toHaveBeenCalled();
  });
});
