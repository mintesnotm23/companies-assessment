import { useTranslations } from "next-intl";
import { useId } from "react";
import { Select, type SelectOption } from "@/components/select";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/api/schema";
import { StatusDot } from "./status-dot";

type Props = {
  q: string;
  status: CompanyStatus | null;
  total: number | undefined;
  isUpdating: boolean;
  hasFilters: boolean;
  onSearch: (q: string) => void;
  onStatusChange: (status: CompanyStatus | null) => void;
  onClearFilters: () => void;
  onCreate: () => void;
};

// Radix Select disallows "" as an item value
const ALL = "all";

export function CompaniesToolbar({
  q,
  status,
  total,
  isUpdating,
  hasFilters,
  onSearch,
  onStatusChange,
  onClearFilters,
  onCreate,
}: Props) {
  const t = useTranslations();
  const id = useId();
  const statusOptions: SelectOption<CompanyStatus | typeof ALL>[] = [
    { value: ALL, label: t("Companies.allStatuses"), icon: <StatusDot status={null} /> },
    ...COMPANY_STATUSES.map((value) => ({
      value,
      label: t(`Status.${value}`),
      icon: <StatusDot status={value} />,
    })),
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1">
        <label htmlFor={`${id}-search`} className="text-sm font-medium">
          {t("Companies.search")}
        </label>
        <input
          id={`${id}-search`}
          type="search"
          value={q}
          onChange={(event) => onSearch(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-status`} className="text-sm font-medium">
          {t("Companies.status")}
        </label>
        <Select
          id={`${id}-status`}
          value={status ?? ALL}
          options={statusOptions}
          onValueChange={(value) => onStatusChange(value === ALL ? null : value)}
          className="min-w-44"
        />
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <ResetIcon />
          {t("Companies.resetFilters")}
        </button>
      )}
      <button
        type="button"
        onClick={onCreate}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {t("Companies.create")}
      </button>
      <p role="status" className="w-full text-sm text-gray-600">
        {isUpdating ? t("Companies.updating") : total !== undefined && t("Companies.resultCount", { total })}
      </p>
    </div>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
