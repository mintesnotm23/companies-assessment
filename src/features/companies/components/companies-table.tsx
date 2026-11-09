import type { UseQueryResult } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import type { MouseEvent, ReactNode } from "react";
import type { Company, CompanyPage, CompanySort } from "@/lib/api/schema";
import { nextSort, sortDirection, type SortableColumn } from "../list-params";
import { StatusDot } from "./status-dot";

const COLUMN_COUNT = 4;

type Props = {
  query: UseQueryResult<CompanyPage>;
  sort: CompanySort;
  hasFilters: boolean;
  companyHref: (id: string) => string;
  onSort: (sort: CompanySort) => void;
  onOpen: (id: string) => void;
  onClearFilters: () => void;
  onFirstPage: () => void;
};

export function CompaniesTable({ sort, onSort, ...rowProps }: Props) {
  const t = useTranslations();
  const { query } = rowProps;

  // Table element stays mounted across states: focus and scroll survive filter changes
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm" aria-busy={query.isFetching}>
        <caption className="sr-only">{t("Companies.title")}</caption>
        <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
          <tr>
            <SortableHeader column="name" sort={sort} onSort={onSort}>
              {t("Companies.columns.name")}
            </SortableHeader>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("Companies.columns.domain")}
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("Companies.columns.status")}
            </th>
            <SortableHeader column="created_at" sort={sort} onSort={onSort}>
              {t("Companies.columns.createdAt")}
            </SortableHeader>
          </tr>
        </thead>
        <tbody className={query.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <TableRows {...rowProps} />
        </tbody>
      </table>
    </div>
  );
}

function TableRows({
  query,
  hasFilters,
  companyHref,
  onOpen,
  onClearFilters,
  onFirstPage,
}: Omit<Props, "sort" | "onSort">) {
  const t = useTranslations();

  if (!query.data) {
    return query.isError ? (
      <MessageRow role="alert">
        {t("Companies.loadError")}{" "}
        <InlineButton onClick={() => void query.refetch()}>{t("Common.retry")}</InlineButton>
      </MessageRow>
    ) : (
      <MessageRow role="status">{t("Companies.loading")}</MessageRow>
    );
  }

  const { items, total } = query.data;
  if (items.length > 0) {
    return items.map((company) => (
      <CompanyRow key={company.id} company={company} href={companyHref(company.id)} onOpen={onOpen} />
    ));
  }

  return total > 0 ? (
    <MessageRow>
      {t("Companies.pageOutOfRange")}{" "}
      <InlineButton onClick={onFirstPage}>{t("Companies.firstPage")}</InlineButton>
    </MessageRow>
  ) : (
    <MessageRow>
      {t("Companies.empty")}{" "}
      {hasFilters && <InlineButton onClick={onClearFilters}>{t("Companies.clearFilters")}</InlineButton>}
    </MessageRow>
  );
}

function SortableHeader({
  column,
  sort,
  onSort,
  children,
}: {
  column: SortableColumn;
  sort: CompanySort;
  onSort: (sort: CompanySort) => void;
  children: ReactNode;
}) {
  const direction = sortDirection(sort, column);
  return (
    <th scope="col" aria-sort={direction} className="px-4 py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(nextSort(sort, column))}
        className="inline-flex items-center gap-1 hover:text-gray-900"
      >
        {children}
        <span aria-hidden="true" className="w-3 text-xs">
          {direction === "ascending" ? "▲" : direction === "descending" ? "▼" : ""}
        </span>
      </button>
    </th>
  );
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function CompanyRow({
  company,
  href,
  onOpen,
}: {
  company: Company;
  href: string;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations("Status");
  const format = useFormatter();

  return (
    <tr
      onClick={() => onOpen(company.id)}
      className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
    >
      <td className="px-4 py-2 font-medium">
        {/* Real link: keyboard focusable, and cmd-click opens the shareable URL in a new tab */}
        <a
          href={href}
          onClick={(event) => {
            if (isModifiedClick(event)) event.stopPropagation();
            else event.preventDefault();
          }}
          className="hover:underline"
        >
          {company.name}
        </a>
      </td>
      <td className="px-4 py-2 text-gray-600">{company.domain ?? "—"}</td>
      <td className="px-4 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
          <StatusDot status={company.status} />
          {t(company.status)}
        </span>
      </td>
      <td className="px-4 py-2 text-gray-600">
        <time dateTime={company.created_at}>
          {format.dateTime(new Date(company.created_at), { dateStyle: "medium" })}
        </time>
      </td>
    </tr>
  );
}

function MessageRow({ role, children }: { role?: "alert" | "status"; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-gray-600">
        <div role={role}>{children}</div>
      </td>
    </tr>
  );
}

function InlineButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-medium text-gray-900 underline">
      {children}
    </button>
  );
}
