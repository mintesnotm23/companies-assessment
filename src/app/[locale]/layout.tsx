import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Providers } from "@/components/providers";
import { SignOutButton } from "@/components/sign-out-button";
import { routing } from "@/i18n/routing";
import "./globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return { title: t("name") };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("App");

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider>
          <Providers>
            <header className="border-b border-gray-200 bg-white">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                <span className="font-semibold">{t("name")}</span>
                <div className="flex items-center gap-4">
                  <LocaleSwitcher />
                  <SignOutButton />
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
