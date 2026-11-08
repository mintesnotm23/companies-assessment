"use client";

import { useTranslations } from "next-intl";

// Render-time crashes only; query errors are handled inline next to the data
export default function CompaniesError({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations();

  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4">
      <p>{t("Companies.loadError")}</p>
      <button type="button" onClick={() => retry()} className="mt-2 text-sm font-medium underline">
        {t("Common.retry")}
      </button>
    </div>
  );
}
