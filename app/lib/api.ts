"use client";

import { authHeaders } from "./auth";
import type {
  AnalyticsSummary,
  ApiErrorPayload,
  AuthSession,
  AdminUser,
  CreatedInstitution,
  DashboardMetricFilters,
  DashboardMetrics,
  FailedRecord,
  Institution,
  ProcessingLog,
} from "./types";
import {
  demoAnalyticsSummary,
  demoFailedRecords,
  demoInstitutions,
  demoLogs,
} from "./demo-analytics";

const apiBase = (
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL ??
  "https://fhir-adapater.onrender.com/api"
).replace(/\/$/, "");
const dataApiBase = (
  process.env.NEXT_PUBLIC_ADAPTER_DATA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL ??
  "https://fhir-adapater.onrender.com/api"
).replace(/\/$/, "");
const adminKey = process.env.NEXT_PUBLIC_ADAPTER_ADMIN_KEY;
const offlineMode =
  process.env.NEXT_PUBLIC_ADAPTER_OFFLINE === "true" ||
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL === "offline";

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

function url(path: string, base = apiBase) {
  const normalizedPath = path.replace(/^\/api/, "");
  return `${base}${normalizedPath}`;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authToken?: string,
  options: { base?: string; preferAdminKey?: boolean } = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.preferAdminKey && adminKey) {
    headers.set("Authorization", `Admin-Key ${adminKey}`);
  } else if (authToken) {
    headers.set("Authorization", `Token ${authToken}`);
  } else {
    Object.entries(authHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  const response = await fetch(url(path, options.base), {
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

type ApiProcessingLog = {
  id: number;
  institution: number | null;
  institution_name: string;
  format_received?: string;
  resource_type?: string;
  time_taken_ms?: number;
  golden_record_id?: string;
  raw_payload?: string | Record<string, unknown>;
  created_at: string;
};

function queryString(filters: DashboardMetricFilters = {}) {
  const params = new URLSearchParams();

  if (filters.created_after) {
    params.set("created_after", filters.created_after);
  }

  if (filters.created_before) {
    params.set("created_before", filters.created_before);
  }

  if (filters.institution) {
    params.set("institution", String(filters.institution));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizeProcessingLog(record: ApiProcessingLog): ProcessingLog {
  return {
    id: record.id,
    institution: record.institution ?? 0,
    institution_name: record.institution_name,
    format_received: record.format_received,
    resource_type: record.resource_type,
    time_taken_ms: record.time_taken_ms,
    golden_record_id: record.golden_record_id,
    raw_payload:
      typeof record.raw_payload === "string"
        ? parseJson(record.raw_payload) ?? { value: record.raw_payload }
        : record.raw_payload,
    created_at: record.created_at,
  };
}

const demoUser: AdminUser = {
  id: 1,
  username: "admin",
  email: "admin@pulsepeak.local",
  first_name: "Demo",
  last_name: "Admin",
  is_staff: true,
  is_superuser: true,
};

let offlineInstitutions = [...demoInstitutions];
let offlineFailedRecords = [...demoFailedRecords];

function matchesFilters(
  record: { institution: number; created_at: string },
  filters: DashboardMetricFilters,
) {
  const createdAt = new Date(record.created_at).getTime();
  const after = filters.created_after ? new Date(filters.created_after).getTime() : null;
  const before = filters.created_before ? new Date(filters.created_before).getTime() : null;

  return (
    (!filters.institution || record.institution === filters.institution) &&
    (after === null || createdAt >= after) &&
    (before === null || createdAt <= before)
  );
}

export async function login(username: string, password: string) {
  if (offlineMode) {
    if (username.trim() !== "admin" || password !== "admin-password") {
      throw new AdapterApiError(401, { message: "Invalid demo credentials" });
    }

    return {
      token: "offline-demo-token",
      status: "success",
      user: demoUser,
    } satisfies AuthSession;
  }

  const loginResponse = await request<{ status: string; token: string }>(
    "/api/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );

  const user = await getCurrentUser(loginResponse.token);

  return {
    token: loginResponse.token,
    status: loginResponse.status,
    user,
  } satisfies AuthSession;
}

export async function getCurrentUser(authToken?: string) {
  if (offlineMode) {
    return demoUser;
  }

  return await request<AdminUser>("/api/auth/me/", {}, authToken);
}

export async function logout() {
  if (offlineMode) {
    return;
  }

  await request<void>("/api/auth/logout/", {
    method: "POST",
  });
}

export async function getMetrics(filters: DashboardMetricFilters = {}) {
  if (offlineMode) {
    const successful = demoLogs.filter((record) => matchesFilters(record, filters)).length;
    const failed = offlineFailedRecords.filter((record) => matchesFilters(record, filters)).length;
    const received = successful + failed;

    return {
      total_received: received,
      total_successful: successful,
      total_failed: failed,
      success_rate: received > 0 ? (successful / received) * 100 : 0,
    } satisfies DashboardMetrics;
  }

  return await request<DashboardMetrics>(
    `/api/dashboard/metrics/${queryString(filters)}`,
    {},
    undefined,
    { base: dataApiBase, preferAdminKey: true },
  );
}

export async function getInstitutions() {
  if (offlineMode) {
    return offlineInstitutions;
  }

  return await request<Institution[]>("/api/institutions/", {}, undefined, {
    base: dataApiBase,
    preferAdminKey: true,
  });
}

export async function createInstitution(input: {
  name: string;
  is_active: boolean;
}) {
  if (offlineMode) {
    const next: CreatedInstitution = {
      id: Math.max(...offlineInstitutions.map((institution) => institution.id)) + 1,
      name: input.name,
      is_active: input.is_active,
      created_at: new Date().toISOString(),
      api_key: `demo_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
    };

    offlineInstitutions = [next, ...offlineInstitutions];
    return next;
  }

  return await request<CreatedInstitution>(
    "/api/institutions/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    undefined,
    { base: dataApiBase, preferAdminKey: true },
  );
}

export async function revokeInstitution(id: number) {
  if (offlineMode) {
    offlineInstitutions = offlineInstitutions.map((institution) =>
      institution.id === id ? { ...institution, is_active: false } : institution,
    );
    return;
  }

  await request<void>(
    `/api/institutions/${id}/revoke/`,
    {
      method: "POST",
    },
    undefined,
    { base: dataApiBase, preferAdminKey: true },
  );
}

export async function getFailedRecords() {
  if (offlineMode) {
    return offlineFailedRecords;
  }

  const records = await request<ApiFailedRecord[]>("/api/dead-letter/", {}, undefined, {
    base: dataApiBase,
    preferAdminKey: true,
  });
  return records.map(normalizeFailedRecord);
}

export async function getProcessingLogs(filters: DashboardMetricFilters = {}) {
  if (offlineMode) {
    return demoLogs.filter((record) => matchesFilters(record, filters));
  }

  const records = await request<ApiProcessingLog[]>(
    `/api/logs/${queryString(filters)}`,
    {},
    undefined,
    { base: dataApiBase, preferAdminKey: true },
  );
  return records.map(normalizeProcessingLog);
}

export async function resolveFailedRecord(id: number, resolution_notes: string) {
  if (offlineMode) {
    const updated = offlineFailedRecords.find((record) => record.id === id);

    if (!updated) {
      throw new AdapterApiError(404, { message: "Demo failed record not found" });
    }

    offlineFailedRecords = offlineFailedRecords.map((record) =>
      record.id === id
        ? { ...record, resolved: true, resolution_notes }
        : record,
    );

    return { ...updated, resolved: true, resolution_notes };
  }

  const record = await request<ApiFailedRecord>(
    `/api/dead-letter/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        resolved: true,
        resolution_notes,
      }),
    },
    undefined,
    { base: dataApiBase, preferAdminKey: true },
  );

  return normalizeFailedRecord(record);
}

export async function getAnalyticsSummary(filters: DashboardMetricFilters = {}) {
  if (offlineMode) {
    return demoAnalyticsSummary;
  }

  try {
    return await request<AnalyticsSummary>(
      `/api/analytics/summary/${queryString(filters)}`,
      {},
      undefined,
      { base: dataApiBase, preferAdminKey: true },
    );
  } catch (error) {
    if (process.env.NEXT_PUBLIC_ADAPTER_USE_DEMO_FALLBACK === "true") {
      return demoAnalyticsSummary;
    }
    throw error;
  }
}
