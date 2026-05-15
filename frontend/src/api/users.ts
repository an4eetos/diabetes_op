import { apiFetch, USE_MOCK_API } from "./client";
import { mockApi } from "./mock";
import type { User, UserRole } from "../types";

export interface UserCreatePayload {
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
  is_active: boolean;
  preferred_language: "ru" | "kk" | "en";
}

export function listUsers(): Promise<User[]> {
  if (USE_MOCK_API) {
    return mockApi.listUsers();
  }
  return apiFetch<User[]>("/users");
}

export function createUser(payload: UserCreatePayload): Promise<User> {
  if (USE_MOCK_API) {
    return mockApi.createUser(payload);
  }
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

