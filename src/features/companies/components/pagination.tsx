import { useTranslations } from "next-intl";
import { pageCount } from "../list-params";

type Props = {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, total, onPageChange }: Props) {
  const t = useTranslations("Companies");
  const pages = pageCount(total);

  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-between text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
      >
        {t("previous")}
      </button>
      <span>{t("pageOf", { page, pages })}</span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
      >
        {t("next")}
      </button>
    </nav>
  );
}
