export type AdminUser = {
  id: number;
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AuthSession = {
  access: string;
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
};

export type CreatedInstitution = Institution & {
  api_key: string;
};

export type ProcessingLog = {
  id: number;
  institution: number;
  institution_name: string;
  format_received: string;
  time_taken_ms: number;
  golden_record_id: string;
  created_at: string;
};

export type FailedRecord = {
  id: number;
  institution: number;
  institution_name: string;
  failure_stage: string;
  error_code: string;
  message: string;
  raw_payload: Record<string, unknown>;
  resolved: boolean;
  resolution_notes?: string;
  created_at: string;
};

export type PatientDraft = {
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "other" | "unknown" | "";
  birth_date: string;
  institution_id: string;
  phone: string;
  address: string;
};

export type PatientSubmission = {
  status: "success" | "error";
  golden_record_id?: string;
  format_detected?: string;
  error_code?: string;
  message?: string;
  details?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  status?: string;
  error_code?: string;
  message?: string;
  details?: Record<string, unknown>;
};
