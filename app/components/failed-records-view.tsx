"use client";

import { Activity, CheckCircle2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFailedRecords, resolveFailedRecord } from "../lib/api";
import { formatDateTime, toSentence } from "../lib/format";
import type { FailedRecord } from "../lib/types";
import {
  Button,
  EmptyState,
  ErrorBanner,
  inputClass,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

export function FailedRecordsView() {
  const [records, setRecords] = useState<FailedRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getFailedRecords();

        if (mounted) {
          setRecords(data);
          setSelectedId(data[0]?.id ?? null);
        }
      } catch {
        if (mounted) {
          setError("Failed records could not be loaded.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return records;
    }

    return records.filter((record) =>
      [
        record.institution_name,
        record.failure_stage,
        record.error_code,
        record.message,
        JSON.stringify(record.error_details ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, records]);

  const selected = records.find((record) => record.id === selectedId) ?? null;

  async function onResolve() {
    if (!selected || !confirmResolve) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await resolveFailedRecord(selected.id, notes.trim());

      setRecords((current) =>
        current.map((record) =>
          record.id === selected.id ? { ...record, ...updated } : record,
        ),
      );
      setConfirmResolve(false);
      setNotes("");
    } catch {
      setError("Record could not be marked as resolved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Review dead-letter records, inspect raw payloads, and require confirmation before marking a record as resolved."
        eyebrow="Failed Records"
        title="Dead-letter review"
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Panel
          action={
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#637166]" />
              <input
                className={`${inputClass} pl-9`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search failed records"
                value={query}
              />
            </label>
          }
          description="Select a row to inspect payload details and resolution controls."
          title="Failed record queue"
        >
          {loading ? (
            <LoadingRows rows={7} />
          ) : filtered.length === 0 ? (
            <EmptyState
              description="There are no matching failed records to review."
              title="No failed records found"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#637166]">
                  <tr>
                    <th className="py-2 pr-4">Institution</th>
                    <th className="py-2 pr-4">Stage</th>
                    <th className="py-2 pr-4">Error</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e9e3]">
                  {filtered.map((record) => (
                    <tr
                      className={`cursor-pointer transition hover:bg-[#f5f8f4] ${
                        selectedId === record.id ? "bg-[#edf5ef]" : ""
                      }`}
                      key={record.id}
                      onClick={() => {
                        setSelectedId(record.id);
                        setConfirmResolve(false);
                        setNotes(record.resolution_notes ?? "");
                      }}
                    >
                      <td className="py-3 pr-4 font-medium text-[#17201b]">
                        {record.institution_name}
                      </td>
                      <td className="py-3 pr-4 text-[#435246]">
                        {toSentence(record.failure_stage)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-[#8f1f16]">
                        {record.error_code}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={record.resolved ? "success" : "danger"}>
                          {record.resolved ? "Resolved" : "Open"}
                        </StatusBadge>
                      </td>
                      <td className="py-3 text-[#637166]">
                        {formatDateTime(record.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          description="Payloads are formatted for review before resolution."
          title="Record detail"
        >
          {!selected ? (
            <EmptyState
              description="Select a failed record to inspect the payload."
              title="No record selected"
            />
          ) : (
            <div className="grid gap-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={selected.resolved ? "success" : "danger"}>
                    {selected.resolved ? "Resolved" : "Open"}
                  </StatusBadge>
                  <StatusBadge tone="warning">
                    {toSentence(selected.failure_stage)}
                  </StatusBadge>
                </div>
                <h2 className="text-lg font-semibold text-[#17201b]">
                  {selected.institution_name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#637166]">
                  {selected.message}
                </p>
              </div>

              {selected.error_details ? (
                <pre className="max-h-52 overflow-auto rounded-md border border-[#f0d6a8] bg-[#fff8ec] p-4 text-xs leading-6 text-[#6b3c0f]">
                  {JSON.stringify(selected.error_details, null, 2)}
                </pre>
              ) : null}

              <pre className="max-h-80 overflow-auto rounded-md border border-[#d8e1d8] bg-[#102018] p-4 text-xs leading-6 text-[#d6f3de]">
                {JSON.stringify(selected.raw_payload, null, 2)}
              </pre>

              <label className="grid gap-2 text-sm font-medium text-[#2d392f]">
                Resolution notes
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  disabled={selected.resolved}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Reviewed and reprocessed manually."
                  value={notes}
                />
              </label>

              <label className="flex items-start gap-3 rounded-md border border-[#d8e1d8] bg-[#fbfcfa] px-3 py-3 text-sm font-medium text-[#2d392f]">
                <input
                  checked={confirmResolve}
                  className="mt-0.5 h-4 w-4 accent-[#2f6b4f]"
                  disabled={selected.resolved}
                  onChange={(event) => setConfirmResolve(event.target.checked)}
                  type="checkbox"
                />
                I confirm this record has been reviewed and can be marked resolved.
              </label>

              <Button
                disabled={selected.resolved || !confirmResolve || saving}
                onClick={onResolve}
                type="button"
              >
                {saving ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Mark resolved
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
