"use client";

import { AlertTriangle, CheckCircle2, Gauge, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getFailedRecords, getMetrics } from "../lib/api";
import { formatDateTime, formatNumber, formatPercent } from "../lib/format";
import type { DashboardMetrics, FailedRecord } from "../lib/types";
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
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [nextMetrics, nextFailedRecords] = await Promise.all([
          getMetrics(),
          getFailedRecords(),
        ]);

        if (!active) {
          return;
        }

        setMetrics(nextMetrics);
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
