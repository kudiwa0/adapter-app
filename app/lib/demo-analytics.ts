import type { AnalyticsSummary, FailedRecord, Institution, ProcessingLog } from "./types";

export const demoInstitutions: Institution[] = [
  { id: 1, name: "HOSP1", is_active: true, created_at: "2026-06-01T08:00:00Z" },
  { id: 2, name: "HOSP2", is_active: true, created_at: "2026-06-01T08:05:00Z" },
  { id: 3, name: "HOSP3", is_active: true, created_at: "2026-06-01T08:10:00Z" },
  { id: 4, name: "HOSP4", is_active: true, created_at: "2026-06-01T08:15:00Z" },
];

export const demoLogs: ProcessingLog[] = [
  {
    id: 101,
    institution: 1,
    institution_name: "HOSP1",
    format_received: "FHIRPassthroughAdapter",
    resource_type: "Patient",
    time_taken_ms: 122,
    golden_record_id: "MPI-SIM-001",
    created_at: "2026-06-03T08:10:00Z",
    raw_payload: demoBundle("female", "1990-01-01", "Malaria"),
  },
  {
    id: 102,
    institution: 2,
    institution_name: "HOSP2",
    format_received: "FHIRPassthroughAdapter",
    resource_type: "Bundle",
    time_taken_ms: 244,
    golden_record_id: "CPR-SIM-001",
    created_at: "2026-06-02T10:20:00Z",
    raw_payload: demoBundle("male", "1982-05-10", "Hypertension"),
  },
  {
    id: 103,
    institution: 3,
    institution_name: "HOSP3",
    format_received: "FHIRPassthroughAdapter",
    resource_type: "Bundle",
    time_taken_ms: 205,
    golden_record_id: "CPR-SIM-002",
    created_at: "2026-05-29T12:05:00Z",
    raw_payload: demoBundle("female", "1975-03-21", "Type 2 diabetes"),
  },
];

export const demoFailedRecords: FailedRecord[] = [
  {
    id: 201,
    institution: 4,
    institution_name: "HOSP4",
    failure_stage: "fhir_validation",
    error_code: "FHIR_VALIDATION",
    message: "Bundle contains no entries.",
    raw_payload: { resourceType: "Bundle", type: "collection", entry: [] },
    resolved: false,
    created_at: "2026-06-03T09:10:00Z",
  },
  {
    id: 202,
    institution: 1,
    institution_name: "HOSP1",
    failure_stage: "factory",
    error_code: "FACTORY",
    message: "Unable to detect payload format.",
    raw_payload: { value: "malformed-json" },
    resolved: false,
    created_at: "2026-05-15T14:40:00Z",
  },
];

export const demoAnalyticsSummary: AnalyticsSummary = {
  metrics: {
    total_received: 278,
    total_successful: 261,
    total_failed: 17,
    success_rate: 93.88,
  },
  transaction_trend: [
    { date: "2026-05-01", successful: 30, failed: 3 },
    { date: "2026-05-08", successful: 36, failed: 2 },
    { date: "2026-05-18", successful: 42, failed: 4 },
    { date: "2026-05-27", successful: 58, failed: 3 },
    { date: "2026-06-02", successful: 103, failed: 3 },
  ],
  failure_stages: [
    { name: "FHIR Validation", value: 9 },
    { name: "Format Detection", value: 5 },
    { name: "Forwarding", value: 3 },
  ],
  system_exchange_volume: [
    { name: "HOSP1", value: 53 },
    { name: "HOSP2", value: 49 },
    { name: "HOSP3", value: 46 },
    { name: "HOSP4", value: 42 },
    { name: "HOSP5", value: 38 },
    { name: "HOSP6", value: 34 },
  ],
  resource_types: [
    { name: "Patient", value: 115 },
    { name: "Bundle", value: 58 },
    { name: "Unknown", value: 17 },
  ],
  people_profiles: [
    { name: "Female, 35-49", value: 46 },
    { name: "Male, 18-34", value: 38 },
    { name: "Female, 50-64", value: 31 },
    { name: "Male, 65+", value: 22 },
  ],
  disease_signals: [
    { name: "Malaria", value: 19 },
    { name: "Hypertension", value: 17 },
    { name: "Type 2 diabetes", value: 14 },
    { name: "Asthma", value: 13 },
    { name: "Tuberculosis", value: 11 },
  ],
  history_query_metrics: {
    total: 64,
    successful: 58,
    failed: 6,
    success_rate: 90.63,
  },
  history_query_trend: [
    { date: "2026-05-27", successful: 8, failed: 1 },
    { date: "2026-05-29", successful: 10, failed: 0 },
    { date: "2026-06-01", successful: 16, failed: 2 },
    { date: "2026-06-03", successful: 24, failed: 3 },
  ],
  history_query_hospitals: [
    { name: "HOSP2", value: 18 },
    { name: "HOSP1", value: 16 },
    { name: "HOSP3", value: 14 },
    { name: "HOSP4", value: 9 },
    { name: "HOSP5", value: 7 },
  ],
  history_query_identifiers: [
    { name: "SIM-900000-000", value: 5 },
    { name: "SIM-900037-037", value: 4 },
    { name: "SIM-900074-074", value: 4 },
    { name: "SIM-900111-111", value: 3 },
  ],
  history_query_statuses: [
    { name: "success", value: 58 },
    { name: "error", value: 6 },
  ],
};

function demoBundle(gender: string, birthDate: string, condition: string) {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          gender,
          birthDate,
        },
      },
      {
        resource: {
          resourceType: "Condition",
          code: { text: condition },
        },
      },
    ],
  };
}
