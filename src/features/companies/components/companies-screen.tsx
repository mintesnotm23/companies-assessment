"use client";

import { useQuery } from "@tanstack/react-query";
import { listCompaniesOptions } from "@/lib/api/companies.queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { SEARCH_DEBOUNCE_MS, useCompaniesParams } from "../hooks/use-companies-params";
import { serializeCompaniesSearch, toListParams } from "../list-params";
import { CompaniesTable } from "./companies-table";
import { CompaniesToolbar } from "./companies-toolbar";
import { CompanyDrawer } from "./company-drawer";
import { Pagination } from "./pagination";

export function CompaniesScreen() {
  const [params, actions] = useCompaniesParams();
  const debouncedQ = useDebouncedValue(params.q, SEARCH_DEBOUNCE_MS);
  const listQuery = useQuery(listCompaniesOptions(toListParams({ ...params, q: debouncedQ })));
  const hasFilters = params.q !== "" || params.status !== null;

  return (
    <div className="space-y-4">
      <CompaniesToolbar
        q={params.q}
        status={params.status}
        total={listQuery.data?.total}
        isUpdating={listQuery.isFetching && listQuery.isPlaceholderData}
        hasFilters={hasFilters}
        onSearch={actions.search}
        onStatusChange={actions.filterStatus}
        onClearFilters={actions.clearFilters}
        onCreate={actions.openCreate}
      />
      <CompaniesTable
        query={listQuery}
        sort={params.sort}
        hasFilters={hasFilters}
        companyHref={(id) => serializeCompaniesSearch({ ...params, company: id })}
        onSort={actions.sortBy}
        onOpen={actions.openCompany}
        onClearFilters={actions.clearFilters}
        onFirstPage={() => actions.goToPage(1)}
      />
      {listQuery.data && listQuery.data.total > 0 && (
        <Pagination page={params.page} total={listQuery.data.total} onPageChange={actions.goToPage} />
      )}
      <CompanyDrawer
        companyParam={params.company}
        onClose={actions.closeDrawer}
        onCreated={actions.showCreated}
      />
    </div>
  );
}
