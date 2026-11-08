import { useTranslations } from "next-intl";
import { useId } from "react";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/api/schema";

type Props = {
  q: string;
  status: CompanyStatus | null;
  total: number | undefined;
  isUpdating: boolean;
  onSearch: (q: string) => void;
  onStatusChange: (status: CompanyStatus | null) => void;
  onCreate: () => void;
};

function parseStatus(value: string): CompanyStatus | null {
  return COMPANY_STATUSES.find((status) => status === value) ?? null;
}

export function CompaniesToolbar({
  q,
  status,
  total,
  isUpdating,
  onSearch,
  onStatusChange,
  onCreate,
}: Props) {
  const t = useTranslations();
  const id = useId();

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
        <select
          id={`${id}-status`}
          value={status ?? ""}
          onChange={(event) => onStatusChange(parseStatus(event.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t("Companies.allStatuses")}</option>
          {COMPANY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`Status.${value}`)}
            </option>
          ))}
        </select>
      </div>
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
