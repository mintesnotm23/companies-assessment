"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { safeNextPath } from "@/lib/auth/redirect";
import { setToken } from "@/lib/auth/token-store";

export function SignInForm() {
  const t = useTranslations("SignIn");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    queryClient.clear();
    setToken(`demo.${crypto.randomUUID()}`);
    router.replace(safeNextPath(searchParams.get("next")));
  }

  return (
    <form onSubmit={signIn} className="mt-6">
      <button
        type="submit"
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {t("submit")}
      </button>
    </form>
  );
}
