const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "/api/v1" : "http://localhost:8000/api/v1");
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";
const ACCESS_TOKEN_KEY = "oas_access_token";
const REFRESH_TOKEN_KEY = "oas_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  }).catch((error) => {
    throw new Error(error instanceof TypeError ? "network_failed" : "request_failed");
  });

  if (response.status === 401) {
    clearTokens();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "request_failed" }));
    throw new Error(error.detail ?? "request_failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).catch(() => {
    throw new Error("network_failed");
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "pdf_generation_failed" }));
    throw new Error(error.detail ?? "pdf_generation_failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
