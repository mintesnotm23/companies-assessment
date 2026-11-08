import {
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT } from "@/lib/api/companies.queries";
import {
  COMPANY_SORTS,
  COMPANY_STATUSES,
  type CompanySort,
  type ListCompaniesParams,
} from "@/lib/api/schema";

export const NEW_COMPANY = "new";

// Invalid values (?page=abc, ?status=foo) parse to null and fall back to defaults
export const companiesSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(COMPANY_STATUSES),
  sort: parseAsStringLiteral(COMPANY_SORTS).withDefault(DEFAULT_SORT),
  page: parseAsInteger.withDefault(1),
  company: parseAsString,
};

export type CompaniesSearchState = inferParserType<typeof companiesSearchParams>;

export const serializeCompaniesSearch = createSerializer(companiesSearchParams);

export function toListParams({
  q,
  status,
  sort,
  page,
}: Pick<CompaniesSearchState, "q" | "status" | "sort" | "page">): ListCompaniesParams {
  const safePage = page >= 1 ? page : 1;
  return {
    q: q.trim() || undefined,
    status: status ?? undefined,
    sort,
    limit: DEFAULT_PAGE_SIZE,
    offset: (safePage - 1) * DEFAULT_PAGE_SIZE,
  };
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
}

export type SortableColumn = "name" | "created_at";

// First click: A→Z for names, newest first for dates; repeat click flips direction
export function nextSort(current: CompanySort, column: SortableColumn): CompanySort {
  if (current === column) return `-${column}`;
  if (current === `-${column}`) return column;
  return column === "name" ? "name" : "-created_at";
}

export function sortDirection(
  current: CompanySort,
  column: SortableColumn,
): "ascending" | "descending" | "none" {
  if (current === column) return "ascending";
  if (current === `-${column}`) return "descending";
  return "none";
}
