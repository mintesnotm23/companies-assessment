import type { Company, CompanyPage, CompanySort, CompanyStatus } from "@/lib/api/schema";

export type ListQuery = {
  limit: number;
  offset: number;
  q?: string;
  status?: CompanyStatus;
  sort: CompanySort;
};

function matchesSearch(company: Company, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    company.name.toLowerCase().includes(needle) || (company.domain?.toLowerCase().includes(needle) ?? false)
  );
}

function compare(a: Company, b: Company, sort: CompanySort): number {
  const direction = sort.startsWith("-") ? -1 : 1;
  const field = sort.replace(/^-/, "") as "name" | "created_at";
  const result =
    field === "name"
      ? a.name.localeCompare(b.name, "en", { sensitivity: "base" })
      : a.created_at.localeCompare(b.created_at);
  // id tiebreak: stable pages when sort keys collide
  return result !== 0 ? result * direction : a.id.localeCompare(b.id);
}

export function queryCompanies(companies: readonly Company[], query: ListQuery): CompanyPage {
  const filtered = companies.filter(
    (company) =>
      (!query.q || matchesSearch(company, query.q)) && (!query.status || company.status === query.status),
  );
  const sorted = [...filtered].sort((a, b) => compare(a, b, query.sort));
  return {
    items: sorted.slice(query.offset, query.offset + query.limit),
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
  };
}
