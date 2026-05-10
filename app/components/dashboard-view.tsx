"use client";

import { AlertTriangle, CheckCircle2, Gauge, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getFailedRecords, getLogs, getMetrics } from "../lib/api";
import { formatDateTime, formatNumber, formatPercent } from "../lib/format";
import type { DashboardMetrics, FailedRecord, ProcessingLog } from "../lib/types";
import {
  EmptyState,
  ErrorBanner,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [nextMetrics, nextLogs, nextFailedRecords] = await Promise.all([
          getMetrics(),
          getLogs(),
          getFailedRecords(),
        ]);

        if (!active) {
          return;
        }

        setMetrics(nextMetrics);
        setLogs(nextLogs.slice(0, 5));
        setFailedRecords(nextFailedRecords.slice(0, 5));
      } catch {
        if (active) {
          setError("Dashboard data could not be loaded.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        description="Track adapter throughput, success rate, and the records that need attention."
        eyebrow="Dashboard"
        title="Operational summary"
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<Inbox className="h-5 w-5" />}
          label="Records received"
          loading={loading}
          value={metrics ? formatNumber(metrics.total_received) : "-"}
        />
        <MetricTile
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Successful"
          loading={loading}
          value={metrics ? formatNumber(metrics.total_successful) : "-"}
        />
        <MetricTile
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Failed"
          loading={loading}
          value={metrics ? formatNumber(metrics.total_failed) : "-"}
        />
        <MetricTile
          icon={<Gauge className="h-5 w-5" />}
          label="Success rate"
          loading={loading}
          value={metrics ? formatPercent(metrics.success_rate) : "-"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          description="Most recent records that completed the adapter pipeline."
          title="Recent successful logs"
        >
          {loading ? <LoadingRows /> : <RecentLogs logs={logs} />}
        </Panel>

        <Panel
          description="Latest failed records requiring review or manual resolution."
          title="Recent failed records"
        >
          {loading ? <LoadingRows /> : <RecentFailedRecords records={failedRecords} />}
        </Panel>
      </div>
    </>
  );
}

function MetricTile({
  icon,
  label,
  value,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#d8e1d8] bg-white p-5 shadow-[0_14px_40px_rgba(23,32,27,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[#637166]">{label}</p>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-[#edf5ef] text-[#2f6b4f]">
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="mt-5 h-8 w-24 animate-pulse rounded bg-[#eef3ee]" />
      ) : (
        <p className="mt-4 font-mono text-3xl font-semibold text-[#17201b]">
          {value}
        </p>
      )}
    </div>
  );
}

function RecentLogs({ logs }: { logs: ProcessingLog[] }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        description="Successful processing activity will appear here."
        title="No logs yet"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-[#637166]">
          <tr>
            <th className="py-2 pr-4">Institution</th>
            <th className="py-2 pr-4">Format</th>
            <th className="py-2 pr-4">Golden ID</th>
            <th className="py-2">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e3e9e3]">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="py-3 pr-4 font-medium text-[#17201b]">
                {log.institution_name}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge tone="neutral">{log.format_received}</StatusBadge>
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
  );
}

function RecentFailedRecords({ records }: { records: FailedRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        description="Failed adapter records will appear here."
        title="No failed records"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {records.map((record) => (
        <div
          className="rounded-md border border-[#e3e9e3] bg-[#fbfcfa] p-4"
          key={record.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-[#17201b]">{record.institution_name}</p>
              <p className="mt-1 text-sm text-[#637166]">{record.message}</p>
            </div>
            <StatusBadge tone={record.resolved ? "success" : "danger"}>
              {record.resolved ? "Resolved" : "Open"}
            </StatusBadge>
          </div>
          <p className="mt-3 font-mono text-xs text-[#637166]">
            {record.error_code} - {formatDateTime(record.created_at)}
          </p>
        </div>
      ))}
    </div>
  );
}
