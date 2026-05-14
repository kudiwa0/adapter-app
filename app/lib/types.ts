export type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AuthSession = {
  access?: string;
  status?: string;
  user: AdminUser;
};

export type DashboardMetrics = {
  total_received: number;
  total_successful: number;
  total_failed: number;
  success_rate: number;
};

export type Institution = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  api_key?: string;
};

export type CreatedInstitution = Institution & {
  api_key: string;
};

export type FailedRecord = {
  id: number;
  institution: number;
  institution_name: string;
  failure_stage: string;
  error_code: string;
  message: string;
  raw_payload: Record<string, unknown>;
  error_details?: unknown;
  resolved: boolean;
  resolution_notes?: string;
  created_at: string;
};

export type ApiErrorPayload = {
  status?: string;
  error_code?: string;
  message?: string;
  details?: Record<string, unknown>;
};
