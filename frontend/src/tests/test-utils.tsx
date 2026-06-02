import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

import "../i18n";
import i18n from "../i18n";

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false }
    }
  });

  i18n.changeLanguage("ru");

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);
}
