import { describe, expect, it } from "vitest";
import * as collection from "@/app/api/v1/companies/route";
import * as item from "@/app/api/v1/companies/[id]/route";

const BASE = "http://localhost/api/v1/companies";
const auth = { Authorization: "Bearer test" };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function json(method: string, url: string, body: unknown, headers: HeadersInit = auth) {
  return new Request(url, {
    method,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("mock API route handlers", () => {
  it("rejects requests without a bearer token", async () => {
    const response = await collection.GET(new Request(BASE), {});
    expect(response.status).toBe(401);
  });

  it("lists with the documented envelope", async () => {
    const response = await collection.GET(new Request(`${BASE}?limit=5&sort=name`, { headers: auth }), {});
    expect(await response.json()).toMatchObject({ total: 40, limit: 5, offset: 0 });
  });

  it("creates with version 1, and 422s on an empty name", async () => {
    const created = await collection.POST(json("POST", BASE, { name: "New BV" }), {});
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ name: "New BV", version: 1, status: "new", domain: null });

    const invalid = await collection.POST(json("POST", BASE, { name: "  " }), {});
    expect(invalid.status).toBe(422);
  });

  it("returns 404 for an unknown company", async () => {
    const response = await item.GET(new Request(`${BASE}/nope`, { headers: auth }), ctx("nope"));
    expect(response.status).toBe(404);
  });

  it("bumps the version on PATCH and 409s on a stale version", async () => {
    const ok = await item.PATCH(
      json("PATCH", `${BASE}/cmp_001`, { if_version: 1, name: "Renamed" }),
      ctx("cmp_001"),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ name: "Renamed", version: 2 });

    const stale = await item.PATCH(
      json("PATCH", `${BASE}/cmp_001`, { if_version: 1, name: "Again" }),
      ctx("cmp_001"),
    );
    expect(stale.status).toBe(409);
  });

  it("422s on PATCH without if_version", async () => {
    const response = await item.PATCH(json("PATCH", `${BASE}/cmp_001`, { name: "X" }), ctx("cmp_001"));
    expect(response.status).toBe(422);
  });
});
