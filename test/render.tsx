import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { TIME_ZONE } from "@/i18n/routing";
import { setToken } from "@/lib/auth/token-store";
import { createQueryClient } from "@/lib/query-client";
import messages from "@/messages/en.json";

type Options = {
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
};

export function renderWithProviders(ui: ReactElement, { searchParams = "", onUrlUpdate }: Options = {}) {
  setToken("test-token");
  const onUnauthorized = vi.fn();
  const queryClient = createQueryClient({ onUnauthorized });

  const result = render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone={TIME_ZONE}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
          {ui}
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );

  return { ...result, user: userEvent.setup(), queryClient, onUnauthorized };
}
