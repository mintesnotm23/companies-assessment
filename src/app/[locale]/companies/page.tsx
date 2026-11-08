import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CompaniesScreen } from "@/features/companies/components/companies-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Companies");
  return { title: t("title") };
}

export default async function CompaniesPage() {
  const t = await getTranslations("Companies");

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
      {/* URL state is request-specific: static shell renders the fallback */}
      <Suspense fallback={<p role="status">{t("loading")}</p>}>
        <CompaniesScreen />
      </Suspense>
    </>
  );
}
