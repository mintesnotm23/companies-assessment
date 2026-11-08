"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, type ReactNode } from "react";
import { clearToken } from "@/lib/auth/token-store";
import { SIGN_IN_PATH, signInUrl } from "@/lib/auth/redirect";
import { createQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() =>
    createQueryClient({
      onUnauthorized: () => {
        clearToken();
        const { pathname, search } = window.location;
        if (pathname !== SIGN_IN_PATH) router.replace(signInUrl(pathname + search));
      },
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
