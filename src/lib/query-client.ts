import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError } from "./api/http";

const MAX_RETRIES = 2;

export function createQueryClient({ onUnauthorized }: { onUnauthorized: () => void }) {
  const handleError = (error: unknown) => {
    if (isApiError(error, 401)) onUnauthorized();
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // 4xx is a definitive answer; only network/5xx are worth retrying
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < MAX_RETRIES,
      },
    },
  });
}
