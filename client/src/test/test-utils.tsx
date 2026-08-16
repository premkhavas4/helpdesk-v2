import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Custom render helper that wraps components in QueryClientProvider for React Query support.
 * Allows passing an optional pre-configured queryClient.
 */
export function renderWithQuery(ui: React.ReactElement, queryClient?: QueryClient) {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={testQueryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient: testQueryClient,
  };
}
