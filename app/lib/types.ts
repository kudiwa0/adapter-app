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
  token?: string;
  status?: string;
  user: AdminUser;
};

export type DashboardMetrics = {
  total_received: number;
  total_successful: number;
  total_failed: number;
  success_rate: number;
};

export type ChartRow = {
  name: string;
  value: number;
};

export type TrendRow = {
  date: string;
  successful: number;
  failed: number;
};

export type HistoryQueryMetrics = {
  total: number;
  successful: number;
  failed: number;
  success_rate: number;
};

export type AnalyticsSummary = {
  metrics: DashboardMetrics;
  transaction_trend: TrendRow[];
  failure_stages: ChartRow[];
  system_exchange_volume: ChartRow[];
  resource_types: ChartRow[];
  people_profiles: ChartRow[];
  disease_signals: ChartRow[];
  history_query_metrics?: HistoryQueryMetrics;
  history_query_trend?: TrendRow[];
  history_query_hospitals?: ChartRow[];
  history_query_identifiers?: ChartRow[];
  history_query_statuses?: ChartRow[];
};

export type DashboardMetricFilters = {
  created_after?: string;
  created_before?: string;
  institution?: number;
};

export type ProcessingLog = {
  id: number;
  institution: number;
  institution_name: string;
  format_received?: string;
  resource_type?: string;
  time_taken_ms?: number;
  golden_record_id?: string;
  raw_payload?: Record<string, unknown>;
  created_at: string;
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
