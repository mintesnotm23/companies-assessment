import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getCompany, listCompanies } from "./companies";
import type { CompanySort, ListCompaniesParams } from "./schema";

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SORT: CompanySort = "-created_at";

export type NormalizedListParams = Required<Pick<ListCompaniesParams, "limit" | "offset" | "sort">> &
  Pick<ListCompaniesParams, "q" | "status">;

// Equivalent requests must share one cache entry: defaults made explicit, blanks dropped
export function normalizeListParams(params: ListCompaniesParams): NormalizedListParams {
  const q = params.q?.trim();
  return {
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    offset: Math.max(0, params.offset ?? 0),
    sort: params.sort ?? DEFAULT_SORT,
    ...(q && { q }),
    ...(params.status && { status: params.status }),
  };
}

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (params: ListCompaniesParams) => [...companyKeys.lists(), normalizeListParams(params)] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
};

export function listCompaniesOptions(params: ListCompaniesParams) {
  const normalized = normalizeListParams(params);
  return queryOptions({
    queryKey: companyKeys.list(normalized),
    queryFn: ({ signal }) => listCompanies(normalized, signal),
    // Keeps rows on screen while the next page/filter loads: no table remount
    placeholderData: keepPreviousData,
  });
}

export function companyOptions(id: string) {
  return queryOptions({
    queryKey: companyKeys.detail(id),
    queryFn: ({ signal }) => getCompany(id, signal),
  });
}
