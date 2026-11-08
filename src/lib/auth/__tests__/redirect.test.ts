import { describe, expect, it } from "vitest";
import { safeNextPath } from "../redirect";

describe("safeNextPath", () => {
  it("keeps same-origin paths including the query string", () => {
    expect(safeNextPath("/companies?status=new&company=cmp_001")).toBe(
      "/companies?status=new&company=cmp_001",
    );
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "", null])("rejects %s", (next) => {
    expect(safeNextPath(next)).toBe("/companies");
  });
});
