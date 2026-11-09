import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { resetStore } from "@/mock-api/store";
import { server } from "./msw-server";

// jsdom gaps Radix Select relies on
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => undefined;
Element.prototype.scrollIntoView ??= () => undefined;

vi.mock("@/mock-api/latency", () => ({ simulateLatency: () => Promise.resolve() }));

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => resetStore());
afterEach(() => {
  server.resetHandlers();
  cleanup();
  globalThis.sessionStorage?.clear();
});
afterAll(() => server.close());
