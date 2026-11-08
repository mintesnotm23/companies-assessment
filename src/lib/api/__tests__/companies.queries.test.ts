import { describe, expect, it } from "vitest";
import { companyKeys, listCompaniesOptions, normalizeListParams } from "../companies.queries";

describe("normalizeListParams", () => {
  it("makes defaults explicit and drops blank filters", () => {
    expect(normalizeListParams({ q: "   ", status: undefined })).toEqual({
      limit: 20,
      offset: 0,
      sort: "-created_at",
    });
  });

  it("trims the search term", () => {
    expect(normalizeListParams({ q: "  acme " }).q).toBe("acme");
  });
});

describe("companyKeys", () => {
  it("gives equivalent list requests the same key", () => {
    expect(companyKeys.list({})).toEqual(
      companyKeys.list({ limit: 20, offset: 0, q: "", sort: "-created_at" }),
    );
  });

  it("gives different filters different keys", () => {
    expect(companyKeys.list({ status: "new" })).not.toEqual(companyKeys.list({ status: "rejected" }));
  });

  it("nests lists and details under one root for broad invalidation", () => {
    expect(companyKeys.list({}).slice(0, 2)).toEqual(companyKeys.lists());
    expect(companyKeys.detail("cmp_001")).toEqual(["companies", "detail", "cmp_001"]);
    expect(companyKeys.lists()[0]).toBe(companyKeys.all[0]);
  });

  it("builds list options on the normalized key", () => {
    expect(listCompaniesOptions({ q: " x " }).queryKey).toEqual(companyKeys.list({ q: "x" }));
  });
});
