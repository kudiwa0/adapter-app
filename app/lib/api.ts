"use client";

import { authHeaders } from "./auth";
import {
  mockFailedRecords,
  mockInstitutions,
  mockLogs,
  mockMetrics,
} from "./mock-data";
import type {
  ApiErrorPayload,
  AuthSession,
  CreatedInstitution,
  DashboardMetrics,
  FailedRecord,
  Institution,
  PatientDraft,
  PatientSubmission,
  ProcessingLog,
} from "./types";

const apiBase = process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL?.replace(/\/$/, "");

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

function shouldUseMockData() {
  return !apiBase;
}

function url(path: string) {
  return `${apiBase}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}) {
  if (shouldUseMockData()) {
    throw new AdapterApiError(503, {
      message: "Adapter API base URL is not configured.",
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  Object.entries(authHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(url(path), {
    ...init,
    headers,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new AdapterApiError(response.status, payload ?? {});
  }

  return payload as T;
}

export function isUnauthorized(error: unknown) {
  return error instanceof AdapterApiError && error.status === 401;
}

export async function login(username: string, password: string) {
  try {
    return await request<AuthSession>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch (error) {
    if (
      shouldUseMockData() &&
      username.trim() === "admin" &&
      password === "admin-password"
    ) {
      return {
        access: "local-demo-admin-session",
        user: {
          id: 1,
          username: "admin",
          is_staff: true,
          is_superuser: true,
        },
      } satisfies AuthSession;
    }

    throw error;
  }
}

export async function logout() {
  if (shouldUseMockData()) {
    return;
  }

  await request<void>("/api/auth/logout/", {
    method: "POST",
  });
}

export async function getMetrics() {
  try {
    return await request<DashboardMetrics>("/api/dashboard/metrics/");
  } catch {
    return mockMetrics;
  }
}

export async function getLogs(filters?: {
  institution?: string;
  format_received?: string;
  created_after?: string;
  created_before?: string;
}) {
  try {
    const params = new URLSearchParams();

    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const query = params.toString();

    return await request<ProcessingLog[]>(`/api/logs/${query ? `?${query}` : ""}`);
  } catch {
    return mockLogs.filter((log) => {
      if (filters?.institution && String(log.institution) !== filters.institution) {
        return false;
      }

      if (
        filters?.format_received &&
        log.format_received !== filters.format_received
      ) {
        return false;
      }

      return true;
    });
  }
}

export async function getInstitutions() {
  try {
    return await request<Institution[]>("/api/institutions/");
  } catch {
    return mockInstitutions;
  }
}

export async function createInstitution(input: {
  name: string;
  is_active: boolean;
}) {
  try {
    return await request<CreatedInstitution>("/api/institutions/", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    return {
      id: Date.now(),
      name: input.name,
      is_active: input.is_active,
      api_key: `ndhs_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
      created_at: new Date().toISOString(),
    } satisfies CreatedInstitution;
  }
}

export async function revokeInstitution(id: number) {
  try {
    await request<void>(`/api/institutions/${id}/revoke/`, {
      method: "POST",
    });
  } catch {
    return;
  }
}

export async function submitPatient(input: PatientDraft) {
  const payload = {
    institution_id: Number(input.institution_id),
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    gender: input.gender,
    birth_date: input.birth_date,
    phone: input.phone.trim() || undefined,
    address: input.address.trim() || undefined,
  };

  try {
    return await request<PatientSubmission>("/api/patients/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof AdapterApiError && !shouldUseMockData()) {
      return error.payload as PatientSubmission;
    }

    return {
      status: "success",
      golden_record_id: `GR-${Math.floor(100 + Math.random() * 900)}`,
      format_detected: "admin-json",
    } satisfies PatientSubmission;
  }
}

export async function getFailedRecords() {
  try {
    return await request<FailedRecord[]>("/api/dead-letter/");
  } catch {
    return mockFailedRecords;
  }
}

export async function resolveFailedRecord(id: number, resolution_notes: string) {
  try {
    return await request<FailedRecord>(`/api/dead-letter/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        resolved: true,
        resolution_notes,
      }),
    });
  } catch {
    const record = mockFailedRecords.find((item) => item.id === id);

    return {
      ...record,
      resolved: true,
      resolution_notes,
    } as FailedRecord;
  }
}
