import { debounce, useQueryStates } from "nuqs";
import { useMemo } from "react";
import type { CompanySort, CompanyStatus } from "@/lib/api/schema";
import { companiesSearchParams, NEW_COMPANY } from "../list-params";

export const SEARCH_DEBOUNCE_MS = 300;

// Typing replaces the history entry; every other deliberate change is a Back-able step
export function useCompaniesParams() {
  const [state, setState] = useQueryStates(companiesSearchParams);

  const actions = useMemo(
    () => ({
      search: (q: string) =>
        setState({ q, page: null }, { history: "replace", limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS) }),
      filterStatus: (status: CompanyStatus | null) => setState({ status, page: null }, { history: "push" }),
      sortBy: (sort: CompanySort) => setState({ sort, page: null }, { history: "push" }),
      goToPage: (page: number) => setState({ page }, { history: "push" }),
      clearFilters: () => setState({ q: null, status: null, page: null }, { history: "push" }),
      openCompany: (id: string) => setState({ company: id }, { history: "push" }),
      openCreate: () => setState({ company: NEW_COMPANY }, { history: "push" }),
      // New record replaces the create entry: Back must not reopen an empty form
      showCreated: (id: string) => setState({ company: id }, { history: "replace" }),
      closeDrawer: () => setState({ company: null }, { history: "push" }),
    }),
    [setState],
  );

  return [state, actions] as const;
}
