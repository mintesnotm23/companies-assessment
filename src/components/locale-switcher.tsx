"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("App");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: Locale) {
    // Read at click time: keeps filters/drawer without subscribing the header to search params
    const href = `${pathname}${window.location.search}`;
    startTransition(() => router.replace(href, { locale }));
  }

  return (
    <div role="group" aria-label={t("language")} className="flex rounded-md border border-gray-300 text-sm">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === activeLocale}
          disabled={isPending}
          onClick={() => switchTo(locale)}
          className="px-2.5 py-1 uppercase first:rounded-l-md last:rounded-r-md aria-pressed:bg-gray-900 aria-pressed:text-white disabled:opacity-60"
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
