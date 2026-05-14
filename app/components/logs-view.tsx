"use client";

import { Activity, Filter, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getInstitutions, getLogs } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { Institution, ProcessingLog } from "../lib/types";
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

type LogFilters = {
  institution: string;
  format_received: string;
  created_after: string;
  created_before: string;
};

const emptyFilters: LogFilters = {
  institution: "",
  format_received: "",
  created_after: "",
  created_before: "",
};

export function LogsView() {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filters, setFilters] = useState<LogFilters>(emptyFilters);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      setLoading(true);
      setError("");

      try {
        const [nextLogs, nextInstitutions] = await Promise.all([
          getLogs(),
          getInstitutions(),
        ]);

        if (mounted) {
          setLogs(nextLogs);
          setInstitutions(nextInstitutions);
        }
      } catch {
        if (mounted) {
          setError("Logs could not be loaded.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return logs;
    }

    return logs.filter((log) =>
      [
        log.institution_name,
        log.format_received,
        log.golden_record_id,
        String(log.time_taken_ms),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [logs, query]);

  async function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const nextLogs = await getLogs(filters);
      setLogs(nextLogs);
    } catch {
      setError("Filtered logs could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof LogFilters>(key: K, value: LogFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <PageHeader
        description="Inspect successful adapter processing activity and filter by source, format, or date window."
        eyebrow="Logs"
        title="Successful processing logs"
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Panel className="mb-6" title="Filters">
        <form className="grid gap-4 lg:grid-cols-5" onSubmit={onFilter}>
          <Field label="Institution">
            <select
              className={inputClass}
              onChange={(event) => update("institution", event.target.value)}
              value={filters.institution}
            >
              <option value="">All institutions</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <select
              className={inputClass}
              onChange={(event) => update("format_received", event.target.value)}
              value={filters.format_received}
            >
              <option value="">All formats</option>
              <option value="fhir">FHIR</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </Field>
          <Field label="Created after">
            <input
              className={inputClass}
              onChange={(event) => update("created_after", event.target.value)}
              type="date"
              value={filters.created_after}
            />
          </Field>
          <Field label="Created before">
            <input
              className={inputClass}
              onChange={(event) => update("created_before", event.target.value)}
              type="date"
              value={filters.created_before}
            />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Apply
            </Button>
          </div>
        </form>
      </Panel>

      <Panel
        action={
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#637166]" />
            <input
              className={`${inputClass} pl-9`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search logs"
              value={query}
            />
          </label>
        }
        description="Processing time and golden record IDs are shown for quick verification."
        title="Log results"
      >
        {loading ? (
          <LoadingRows rows={8} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            description="Change the filters or wait for successful adapter activity."
            title="No logs found"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[#637166]">
                <tr>
                  <th className="py-2 pr-4">Institution</th>
                  <th className="py-2 pr-4">Format</th>
                  <th className="py-2 pr-4">Processing time</th>
                  <th className="py-2 pr-4">Golden record ID</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e9e3]">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pr-4 font-medium text-[#17201b]">
                      {log.institution_name}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge tone="neutral">{log.format_received}</StatusBadge>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[#435246]">
                      {log.time_taken_ms}ms
                    </td>
                    <td className="py-3 pr-4 font-mono text-[#435246]">
                      {log.golden_record_id}
                    </td>
                    <td className="py-3 text-[#637166]">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
