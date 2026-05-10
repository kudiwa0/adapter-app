import type {
  DashboardMetrics,
  FailedRecord,
  Institution,
  ProcessingLog,
} from "./types";

export const mockMetrics: DashboardMetrics = {
  total_received: 120,
  total_successful: 114,
  total_failed: 6,
  success_rate: 95,
};

export const mockInstitutions: Institution[] = [
  {
    id: 2,
    name: "OpenMRS General Hospital",
    is_active: true,
    created_at: "2026-05-10T12:00:00Z",
  },
  {
    id: 3,
    name: "District Referral Clinic",
    is_active: true,
    created_at: "2026-05-09T08:30:00Z",
  },
  {
    id: 4,
    name: "Mobile Outreach Unit",
    is_active: false,
    created_at: "2026-05-08T15:45:00Z",
  },
];

export const mockLogs: ProcessingLog[] = [
  {
    id: 1,
    institution: 2,
    institution_name: "OpenMRS General Hospital",
    format_received: "fhir",
    time_taken_ms: 430,
    golden_record_id: "GR-123",
    created_at: "2026-05-10T12:00:00Z",
  },
  {
    id: 2,
    institution: 3,
    institution_name: "District Referral Clinic",
    format_received: "fhir",
    time_taken_ms: 388,
    golden_record_id: "GR-124",
    created_at: "2026-05-10T11:12:00Z",
  },
  {
    id: 3,
    institution: 2,
    institution_name: "OpenMRS General Hospital",
    format_received: "json",
    time_taken_ms: 502,
    golden_record_id: "GR-125",
    created_at: "2026-05-09T16:30:00Z",
  },
];

export const mockFailedRecords: FailedRecord[] = [
  {
    id: 10,
    institution: 2,
    institution_name: "OpenMRS General Hospital",
    failure_stage: "validation",
    error_code: "FHIR_VALIDATION_ERROR",
    message: "Patient birth date is missing.",
    raw_payload: {
      resourceType: "Patient",
      name: [{ family: "Zulu", given: ["Tariro"] }],
      gender: "female",
    },
    resolved: false,
    created_at: "2026-05-10T09:20:00Z",
  },
  {
    id: 11,
    institution: 3,
    institution_name: "District Referral Clinic",
    failure_stage: "forwarding",
    error_code: "GOLDEN_RECORD_TIMEOUT",
    message: "Golden record service timed out after 30 seconds.",
    raw_payload: {
      first_name: "Moses",
      last_name: "Banda",
      gender: "male",
      birth_date: "1992-06-13",
    },
    resolved: false,
    created_at: "2026-05-10T07:12:00Z",
  },
  {
    id: 12,
    institution: 4,
    institution_name: "Mobile Outreach Unit",
    failure_stage: "normalization",
    error_code: "UNSUPPORTED_GENDER_VALUE",
    message: "The gender value could not be mapped to FHIR.",
    raw_payload: {
      first_name: "Amina",
      last_name: "Phiri",
      gender: "not-specified",
      birth_date: "1988-02-02",
    },
    resolved: true,
    resolution_notes: "Mapped manually and resubmitted.",
    created_at: "2026-05-09T14:42:00Z",
  },
];
