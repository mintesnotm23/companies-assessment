import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth/token-store";
import { API, server } from "@test/msw-server";
import { listCompanies, updateCompany } from "../companies";
import { ApiError } from "../http";

describe("api client", () => {
  it("attaches the bearer token and serializes only defined query params", async () => {
    setToken("secret-token");
    const seen = vi.fn();
    server.use(
      http.get(`${API}/companies`, ({ request }) => {
        seen(request.headers.get("authorization"), new URL(request.url).search);
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 });
      }),
    );

    await listCompanies({ limit: 20, offset: 0, q: undefined, status: "new" });

    expect(seen).toHaveBeenCalledWith("Bearer secret-token", "?limit=20&offset=0&status=new");
  });

  it("fails as a 401 without calling the API when there is no token", async () => {
    const seen = vi.fn();
    server.use(http.get(`${API}/companies`, seen));

    await expect(listCompanies({})).rejects.toMatchObject({ status: 401 });
    expect(seen).not.toHaveBeenCalled();
  });

  it("exposes FastAPI validation details on 422", async () => {
    setToken("t");
    const error = await updateCompany("cmp_001", { if_version: 1, name: " " }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).validationErrors).toEqual([
      expect.objectContaining({ loc: ["body", "name"], type: "too_small" }),
    ]);
  });

  it("surfaces 409 with the server's message", async () => {
    setToken("t");
    const error = await updateCompany("cmp_001", { if_version: 99, name: "X" }).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 409, message: expect.stringContaining("current is 1") });
  });
});
