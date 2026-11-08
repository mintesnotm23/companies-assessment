import "server-only";
import type { z } from "zod";
import type { Company } from "@/lib/api/schema";
import { queryCompanies, type ListQuery } from "./query";
import { seedCompanies } from "./seed";
import type { createCompanyInput, updateCompanyInput } from "./validation";

// globalThis: survives dev HMR module reloads; still per-process by design
const globalStore = globalThis as typeof globalThis & {
  __mockCompanies?: Company[];
};

function table(): Company[] {
  globalStore.__mockCompanies ??= seedCompanies();
  return globalStore.__mockCompanies;
}

export function resetStore() {
  globalStore.__mockCompanies = seedCompanies();
}

export function listCompanies(query: ListQuery) {
  return queryCompanies(table(), query);
}

export function findCompany(id: string): Company | null {
  return table().find((company) => company.id === id) ?? null;
}

export function insertCompany(input: z.output<typeof createCompanyInput>): Company {
  const now = new Date().toISOString();
  const company: Company = {
    id: `cmp_${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    domain: input.domain ?? null,
    status: input.status ?? "new",
    version: 1,
    created_at: now,
    updated_at: now,
  };
  table().push(company);
  return company;
}

export type UpdateResult =
  { kind: "updated"; company: Company } | { kind: "not_found" } | { kind: "conflict"; current: Company };

export function updateCompany(
  id: string,
  { if_version, ...changes }: z.output<typeof updateCompanyInput>,
): UpdateResult {
  const rows = table();
  const index = rows.findIndex((company) => company.id === id);
  const current = rows[index];
  if (!current) return { kind: "not_found" };
  if (current.version !== if_version) return { kind: "conflict", current };

  const updated: Company = {
    ...current,
    ...(changes.name !== undefined && { name: changes.name }),
    ...(changes.domain !== undefined && { domain: changes.domain }),
    ...(changes.status !== undefined && { status: changes.status }),
    version: current.version + 1,
    updated_at: new Date().toISOString(),
  };
  rows[index] = updated;
  return { kind: "updated", company: updated };
}
