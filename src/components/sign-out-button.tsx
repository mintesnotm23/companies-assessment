"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/redirect";
import { clearToken, useIsSignedIn } from "@/lib/auth/token-store";

export function SignOutButton() {
  const t = useTranslations("App");
  const isSignedIn = useIsSignedIn();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (!isSignedIn) return null;

  function signOut() {
    clearToken();
    // Tenant data must not outlive the session that fetched it
    queryClient.clear();
    router.replace(SIGN_IN_PATH);
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm text-gray-700 underline-offset-2 hover:underline"
    >
      {t("signOut")}
    </button>
  );
}
