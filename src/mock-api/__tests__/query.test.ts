import { describe, expect, it } from "vitest";
import { queryCompanies } from "../query";
import { seedCompanies } from "../seed";

const companies = seedCompanies();
const defaults = { limit: 20, offset: 0, sort: "-created_at" as const };

describe("queryCompanies", () => {
  it("paginates with the total of the filtered set", () => {
    const page = queryCompanies(companies, { ...defaults, offset: 20 });
    expect(page).toMatchObject({ total: 40, limit: 20, offset: 20 });
    expect(page.items).toHaveLength(20);
  });

  it("searches name and domain case-insensitively", () => {
    expect(queryCompanies(companies, { ...defaults, q: "FJORD" }).items.map((c) => c.name)).toEqual([
      "Fjord Robotics",
    ]);
    expect(queryCompanies(companies, { ...defaults, q: "acmelogistics.example" }).total).toBe(1);
  });

  it("filters by status", () => {
    const page = queryCompanies(companies, { ...defaults, status: "rejected" });
    expect(page.total).toBe(8);
    expect(page.items.every((c) => c.status === "rejected")).toBe(true);
  });

  it("sorts by name both ways", () => {
    expect(queryCompanies(companies, { ...defaults, sort: "name" }).items[0]?.name).toBe("Acme Logistics");
    expect(queryCompanies(companies, { ...defaults, sort: "-name" }).items[0]?.name).toBe("Zephyr Travel");
  });

  it("sorts by creation date both ways", () => {
    expect(queryCompanies(companies, { ...defaults, sort: "created_at" }).items[0]?.id).toBe("cmp_001");
    expect(queryCompanies(companies, { ...defaults, sort: "-created_at" }).items[0]?.id).toBe("cmp_040");
  });
});
