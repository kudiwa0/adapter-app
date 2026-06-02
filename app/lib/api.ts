"use client";

import { authHeaders } from "./auth";
import type {
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

const apiBase = (
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL ??
  "https://fhir-adapater.onrender.com/api"
).replace(/\/$/, "");
const dataApiBase = (
  process.env.NEXT_PUBLIC_ADAPTER_DATA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ADAPTER_API_BASE_URL ??
  "https://fhir-adapater.onrender.com/api"
).replace(/\/$/, "");
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

function url(path: string) {
  const normalizedPath = path.replace(/^\/api/, "");
  return `${apiBase}${normalizedPath}`;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authToken?: string
) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Token ${authToken}`);
  } else {
    Object.entries(authHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

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

let demoInstitutions: Institution[] = [
  {
    id: 1,
    name: "OpenMRS General Hospital",
    is_active: true,
    created_at: "2026-05-28T08:00:00Z",
  },
  {
    id: 2,
    name: "District Lab Exchange",
    is_active: true,
    created_at: "2026-05-29T10:20:00Z",
  },
  {
    id: 3,
    name: "Community Clinic Network",
    is_active: false,
    created_at: "2026-05-30T13:45:00Z",
  },
];

const demoLogs: ProcessingLog[] = [
  {
    id: 101,
    institution: 1,
    institution_name: "OpenMRS General Hospital",
    format_received: "fhir",
    resource_type: "Bundle",
    time_taken_ms: 430,
    golden_record_id: "GR-1001",
    created_at: "2026-06-02T07:10:00Z",
    raw_payload: demoBundle("female", "1986-03-18", "Hypertension"),
  },
  {
    id: 102,
    institution: 2,
    institution_name: "District Lab Exchange",
    format_received: "fhir",
    resource_type: "Observation",
    time_taken_ms: 315,
    golden_record_id: "GR-1002",
    created_at: "2026-06-02T08:35:00Z",
    raw_payload: demoBundle("male", "1972-11-01", "Diabetes mellitus"),
  },
  {
    id: 103,
    institution: 1,
    institution_name: "OpenMRS General Hospital",
    format_received: "fhir",
    resource_type: "Bundle",
    time_taken_ms: 522,
    golden_record_id: "GR-1003",
    created_at: "2026-06-01T15:40:00Z",
    raw_payload: demoBundle("female", "2014-09-04", "Asthma"),
  },
  {
    id: 104,
    institution: 1,
    institution_name: "OpenMRS General Hospital",
    format_received: "fhir",
    resource_type: "Bundle",
    time_taken_ms: 280,
    golden_record_id: "GR-1004",
    created_at: "2026-05-22T12:15:00Z",
    raw_payload: demoBundle("male", "1994-01-27", "Tuberculosis"),
  },
  {
    id: 105,
    institution: 2,
    institution_name: "District Lab Exchange",
    format_received: "fhir",
    resource_type: "Bundle",
    time_taken_ms: 388,
    golden_record_id: "GR-1005",
    created_at: "2026-05-08T09:10:00Z",
    raw_payload: demoBundle("female", "1958-07-12", "HIV infection"),
  },
];

let demoFailedRecords: FailedRecord[] = [
  {
    id: 201,
    institution: 2,
    institution_name: "District Lab Exchange",
    failure_stage: "validation",
    error_code: "VALIDATION",
    message: "FHIR payload is missing a required patient identifier.",
    raw_payload: demoBundle("male", "1989-02-10", "Malaria"),
    error_details: { field: "Patient.identifier", severity: "error" },
    resolved: false,
    created_at: "2026-06-02T09:25:00Z",
  },
  {
    id: 202,
    institution: 1,
    institution_name: "OpenMRS General Hospital",
    failure_stage: "forwarding",
    error_code: "FORWARDING",
    message: "Golden record service timed out before accepting the transaction.",
    raw_payload: demoBundle("female", "1968-12-05", "Hypertension"),
    error_details: { timeout_ms: 30000 },
    resolved: false,
    created_at: "2026-06-01T11:05:00Z",
  },
  {
    id: 203,
    institution: 3,
    institution_name: "Community Clinic Network",
    failure_stage: "normalization",
    error_code: "NORMALIZATION",
    message: "Condition coding could not be mapped to the configured profile.",
    raw_payload: demoBundle("unknown", "2001-05-19", "Cholera"),
    error_details: { code_system: "local-clinic-codes" },
    resolved: true,
    resolution_notes: "Mapped manually and replayed.",
    created_at: "2026-05-15T14:30:00Z",
  },
];

function demoBundle(gender: string, birthDate: string, condition: string) {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          gender,
          birthDate,
          identifier: [{ system: "https://pulsepeak.local/mrn", value: "DEMO" }],
        },
      },
      {
        resource: {
          resourceType: "Condition",
          code: {
            text: condition,
            coding: [{ system: "http://snomed.info/sct", display: condition }],
          },
        },
      },
    ],
  };
}

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
    const failed = demoFailedRecords.filter((record) => matchesFilters(record, filters)).length;
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
  );
}

export async function getInstitutions() {
  if (offlineMode) {
    return demoInstitutions;
  }

  return await request<Institution[]>("/api/institutions/");
}

export async function createInstitution(input: {
  name: string;
  is_active: boolean;
}) {
  if (offlineMode) {
    const next: CreatedInstitution = {
      id: Math.max(...demoInstitutions.map((institution) => institution.id)) + 1,
      name: input.name,
      is_active: input.is_active,
      created_at: new Date().toISOString(),
      api_key: `demo_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
    };

    demoInstitutions = [next, ...demoInstitutions];
    return next;
  }

  return await request<CreatedInstitution>("/api/institutions/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function revokeInstitution(id: number) {
  if (offlineMode) {
    demoInstitutions = demoInstitutions.map((institution) =>
      institution.id === id ? { ...institution, is_active: false } : institution,
    );
    return;
  }

  await request<void>(`/api/institutions/${id}/revoke/`, {
    method: "POST",
  });
}

export async function getFailedRecords() {
  if (offlineMode) {
    return demoFailedRecords;
  }

  const records = await request<ApiFailedRecord[]>("/api/dead-letter/");
  return records.map(normalizeFailedRecord);
}

export async function getProcessingLogs(filters: DashboardMetricFilters = {}) {
  if (offlineMode) {
    return demoLogs.filter((record) => matchesFilters(record, filters));
  }

  const records = await request<ApiProcessingLog[]>(
    `/api/logs/${queryString(filters)}`,
  );
  return records.map(normalizeProcessingLog);
}

export async function resolveFailedRecord(id: number, resolution_notes: string) {
  if (offlineMode) {
    const updated = demoFailedRecords.find((record) => record.id === id);

    if (!updated) {
      throw new AdapterApiError(404, { message: "Demo failed record not found" });
    }

    demoFailedRecords = demoFailedRecords.map((record) =>
      record.id === id
        ? { ...record, resolved: true, resolution_notes }
        : record,
    );

    return { ...updated, resolved: true, resolution_notes };
  }

  const record = await request<ApiFailedRecord>(`/api/dead-letter/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      resolved: true,
      resolution_notes,
    }),
  });

  return normalizeFailedRecord(record);
}
