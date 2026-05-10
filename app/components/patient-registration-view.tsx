"use client";

import { Activity, ClipboardCheck, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getInstitutions, submitPatient } from "../lib/api";
import type { Institution, PatientDraft, PatientSubmission } from "../lib/types";
import {
  Button,
  ErrorBanner,
  Field,
  inputClass,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

const emptyDraft: PatientDraft = {
  first_name: "",
  last_name: "",
  gender: "",
  birth_date: "",
  institution_id: "",
  phone: "",
  address: "",
};

export function PatientRegistrationView() {
  const [draft, setDraft] = useState<PatientDraft>(emptyDraft);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<PatientSubmission | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInstitutions() {
      setLoading(true);

      try {
        const data = await getInstitutions();

        if (mounted) {
          setInstitutions(data.filter((institution) => institution.is_active));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInstitutions();

    return () => {
      mounted = false;
    };
  }, []);

  const adminPayloadPreview = useMemo(
    () => ({
      institution_id: draft.institution_id
        ? Number(draft.institution_id)
        : "select-institution",
      first_name: draft.first_name || "John",
      last_name: draft.last_name || "Doe",
      gender: draft.gender || "male",
      birth_date: draft.birth_date || "1980-01-01",
      phone: draft.phone || undefined,
      address: draft.address || undefined,
    }),
    [draft],
  );

  function update<K extends keyof PatientDraft>(key: K, value: PatientDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!draft.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
    }

    if (!draft.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
    }

    if (!draft.gender) {
      nextErrors.gender = "Gender is required.";
    }

    if (!draft.birth_date) {
      nextErrors.birth_date = "Birth date is required.";
    }

    if (!draft.institution_id) {
      nextErrors.institution_id = "Choose the source institution.";
    }

    setErrors(nextErrors);
    setFormError("");
    setResult(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const submission = await submitPatient(draft);
      setResult(submission);

      if (submission.status === "success") {
        setDraft(emptyDraft);
      }
    } catch {
      setFormError("Patient submission could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Submit patient demographics through the admin patient endpoint and keep a live preview of the outbound payload."
        eyebrow="Register Patient"
        title="Manual patient submission"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          description="Minimum required fields are validated before the request is sent."
          title="Patient details"
        >
          <form className="grid gap-5" onSubmit={onSubmit}>
            {formError ? <ErrorBanner message={formError} /> : null}
            {result?.status === "success" ? (
              <div className="flex items-start gap-3 rounded-md border border-[#bfe6d5] bg-[#e9f8f1] p-4 text-sm text-[#1f4d39]">
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Patient submitted successfully.</p>
                  <p className="mt-1 font-mono">
                    {result.golden_record_id} / {result.format_detected}
                  </p>
                </div>
              </div>
            ) : null}
            {result?.status === "error" ? (
              <ErrorBanner message={result.message || "Patient validation failed."} />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={errors.first_name} label="First name">
                <input
                  className={inputClass}
                  onChange={(event) => update("first_name", event.target.value)}
                  value={draft.first_name}
                />
              </Field>
              <Field error={errors.last_name} label="Last name">
                <input
                  className={inputClass}
                  onChange={(event) => update("last_name", event.target.value)}
                  value={draft.last_name}
                />
              </Field>
              <Field error={errors.gender} label="Gender">
                <select
                  className={inputClass}
                  onChange={(event) =>
                    update("gender", event.target.value as PatientDraft["gender"])
                  }
                  value={draft.gender}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>
              <Field error={errors.birth_date} label="Birth date">
                <input
                  className={inputClass}
                  onChange={(event) => update("birth_date", event.target.value)}
                  type="date"
                  value={draft.birth_date}
                />
              </Field>
            </div>

            <Field error={errors.institution_id} label="Source institution">
              {loading ? (
                <LoadingRows rows={1} />
              ) : (
                <select
                  className={inputClass}
                  onChange={(event) =>
                    update("institution_id", event.target.value)
                  }
                  value={draft.institution_id}
                >
                  <option value="">Select active institution</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  className={inputClass}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+260..."
                  value={draft.phone}
                />
              </Field>
              <Field label="Address">
                <input
                  className={inputClass}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Clinic catchment address"
                  value={draft.address}
                />
              </Field>
            </div>

            <Button disabled={submitting || loading} type="submit">
              {submitting ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit patient
            </Button>
          </form>
        </Panel>

        <Panel title="Admin payload preview">
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge tone="neutral">POST /api/patients/</StatusBadge>
            <StatusBadge tone="success">Admin session</StatusBadge>
          </div>
          <pre className="max-h-[520px] overflow-auto rounded-md border border-[#d8e1d8] bg-[#102018] p-4 text-xs leading-6 text-[#d6f3de]">
            {JSON.stringify(adminPayloadPreview, null, 2)}
          </pre>
        </Panel>
      </div>
    </>
  );
}
