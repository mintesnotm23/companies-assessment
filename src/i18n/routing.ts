import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "nl"],
  defaultLocale: "en",
  // URLs stay /companies; proxy rewrites to /[locale] from cookie or Accept-Language
  localePrefix: "never",
});

export type Locale = (typeof routing.locales)[number];

// Product is Dutch-first; one zone keeps SSR and client output identical
export const TIME_ZONE = "Europe/Amsterdam";
