import { apiFetch, setTokens, USE_MOCK_API } from "./client";
import { mockApi } from "./mock";
import type { SupportedLanguage, User } from "../types";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export async function login(email: string, password: string): Promise<void> {
  if (USE_MOCK_API) {
    await mockApi.login(email, password);
    setTokens("mock-access-token", "mock-refresh-token");
    return;
  }
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setTokens(response.access_token, response.refresh_token);
}

export function getMe(): Promise<User> {
  if (USE_MOCK_API) {
    return mockApi.getMe();
  }
  return apiFetch<User>("/auth/me");
}

export function updateMyPreferences(preferredLanguage: SupportedLanguage): Promise<User> {
  if (USE_MOCK_API) {
    return mockApi.updateMyPreferences(preferredLanguage);
  }
  return apiFetch<User>("/auth/me/preferences", {
    method: "PATCH",
    body: JSON.stringify({ preferred_language: preferredLanguage })
  });
}
