import { describe, expect, it } from "vitest";
import { nextSort, pageCount, sortDirection, toListParams } from "../list-params";

describe("toListParams", () => {
  it("maps a 1-based page to offset", () => {
    expect(toListParams({ q: "", status: null, sort: "name", page: 3 })).toEqual({
      q: undefined,
      status: undefined,
      sort: "name",
      limit: 20,
      offset: 40,
    });
  });

  it("clamps nonsense pages to the first page", () => {
    expect(toListParams({ q: "", status: null, sort: "name", page: -4 }).offset).toBe(0);
  });
});

describe("nextSort", () => {
  it("starts names A→Z and dates newest first", () => {
    expect(nextSort("-created_at", "name")).toBe("name");
    expect(nextSort("name", "created_at")).toBe("-created_at");
  });

  it("flips direction on the active column", () => {
    expect(nextSort("name", "name")).toBe("-name");
    expect(nextSort("-name", "name")).toBe("name");
  });
});

describe("sortDirection", () => {
  it("reports aria-sort values", () => {
    expect(sortDirection("-created_at", "created_at")).toBe("descending");
    expect(sortDirection("-created_at", "name")).toBe("none");
  });
});

describe("pageCount", () => {
  it("never returns zero pages", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(41)).toBe(3);
  });
});
