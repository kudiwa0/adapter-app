"use client";

import { authHeaders } from "./auth";
import type {
  ApiErrorPayload,
  AuthSession,
  AdminUser,
  CreatedInstitution,
  DashboardMetrics,
  FailedRecord,
  Institution,
} from "./types";

const apiBase = (
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL ??
  "https://engorge-knoll-crust.ngrok-free.dev/api"
).replace(/\/$/, "");

class AdapterApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || "Request failed");
    this.name = "AdapterApiError";
    this.status = status;
    this.payload = payload;
  }
}

function url(path: string) {
  const normalizedPath = path.replace(/^\/api/, "");
  return `${apiBase}${normalizedPath}`;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  Object.entries(authHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(url(path), {
    ...init,
    credentials: "include",
    headers,
  });

  const text = await response.text();
  const payload = parseJson(text);

  if (!response.ok) {
    throw new AdapterApiError(response.status, payload ?? {});
  }

  return payload as T;
}

function parseJson(text: string) {
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

type ApiFailedRecord = {
  id: number;
  institution: number | null;
  institution_name: string;
  raw_payload: string | Record<string, unknown>;
  error_message: string;
  error_details: unknown;
  stage: string;
  resolved: boolean;
  resolution_notes?: string | null;
  created_at: string;
};

function normalizeFailedRecord(record: ApiFailedRecord): FailedRecord {
  return {
    id: record.id,
    institution: record.institution ?? 0,
    institution_name: record.institution_name,
    failure_stage: record.stage,
    error_code: record.stage.toUpperCase(),
    message: record.error_message,
    raw_payload:
      typeof record.raw_payload === "string"
        ? parseJson(record.raw_payload) ?? { value: record.raw_payload }
        : record.raw_payload,
    error_details: record.error_details,
    resolved: record.resolved,
    resolution_notes: record.resolution_notes ?? undefined,
    created_at: record.created_at,
  };
}

export function isUnauthorized(error: unknown) {
  return error instanceof AdapterApiError && error.status === 401;
}

export async function login(username: string, password: string) {
  await request<AuthSession>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const user = await getCurrentUser();

  return {
    status: "success",
    user,
  } satisfies AuthSession;
}

export async function getCurrentUser() {
  return await request<AdminUser>("/api/auth/me/");
}

export async function logout() {
  await request<void>("/api/auth/logout/", {
    method: "POST",
  });
}

export async function getMetrics() {
  return await request<DashboardMetrics>("/api/dashboard/metrics/");
}

export async function getInstitutions() {
  return await request<Institution[]>("/api/institutions/");
}

export async function createInstitution(input: {
  name: string;
  is_active: boolean;
}) {
  return await request<CreatedInstitution>("/api/institutions/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function revokeInstitution(id: number) {
  await request<void>(`/api/institutions/${id}/revoke/`, {
    method: "POST",
  });
}

export async function getFailedRecords() {
  const records = await request<ApiFailedRecord[]>("/api/dead-letter/");
  return records.map(normalizeFailedRecord);
}

export async function resolveFailedRecord(id: number, resolution_notes: string) {
  const record = await request<ApiFailedRecord>(`/api/dead-letter/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      resolved: true,
      resolution_notes,
    }),
  });

  return normalizeFailedRecord(record);
}
