"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Database,
  Filter,
  HeartPulse,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getFailedRecords,
  getAnalyticsSummary,
  getInstitutions,
  getMetrics,
  getProcessingLogs,
} from "../lib/api";
import { formatNumber, formatPercent, toSentence } from "../lib/format";
import type {
  DashboardMetricFilters,
  DashboardMetrics,
  AnalyticsSummary,
  FailedRecord,
  Institution,
  ProcessingLog,
} from "../lib/types";
import { EmptyState, ErrorBanner, inputClass, PageHeader, StatusBadge } from "./ui";

type TimePreset = "today" | "yesterday" | "last7" | "last30" | "lastMonth" | "all";
type ChartRow = { name: string; value: number; fill?: string };
type SignalTheme = "resource" | "profile" | "disease";

const palette = {
  received: "#2563eb",
  successful: "#16a34a",
  failed: "#dc2626",
  warning: "#f59e0b",
  violet: "#7c3aed",
  cyan: "#0891b2",
  slate: "#475569",
};

const timePresets: { label: string; value: TimePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7" },
  { label: "Last 30 days", value: "last30" },
  { label: "Last month", value: "lastMonth" },
  { label: "All time", value: "all" },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function resolveRange(preset: TimePreset) {
  const now = new Date();

  if (preset === "all") {
    return {};
  }

  if (preset === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
  }

  if (preset === "lastMonth") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }

  const days = preset === "last7" ? 6 : 29;
  const from = startOfDay(now);
  from.setDate(from.getDate() - days);
  return { from, to: endOfDay(now) };
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function inRange(value: string, from?: Date, to?: Date) {
  const time = new Date(value).getTime();
  return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
}

function getResourceType(payload?: Record<string, unknown>) {
  const type = payload?.resourceType;

  if (typeof type === "string") {
    return type;
  }

  const entries = payload?.entry;

  if (Array.isArray(entries)) {
    const resourceTypes = entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const resource = (entry as { resource?: { resourceType?: unknown } }).resource;
        return typeof resource?.resourceType === "string" ? resource.resourceType : null;
      })
      .filter(Boolean);

    return resourceTypes[0] ?? "FHIR Bundle";
  }

  return "Unknown";
}

function getNestedString(source: unknown, keys: string[]) {
  let current = source;

  for (const key of keys) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

function collectFhirResources(payload?: Record<string, unknown>) {
  if (!payload) {
    return [];
  }

  const directType = payload.resourceType;

  if (typeof directType === "string" && directType !== "Bundle") {
    return [payload];
  }

  const entries = payload.entry;

  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const resource = (entry as { resource?: unknown }).resource;
      return resource && typeof resource === "object"
        ? (resource as Record<string, unknown>)
        : null;
    })
    .filter((resource): resource is Record<string, unknown> => Boolean(resource));
}

function getPatientProfile(payload?: Record<string, unknown>) {
  const patient = collectFhirResources(payload).find(
    (resource) => resource.resourceType === "Patient",
  );

  if (!patient) {
    return "Unknown profile";
  }

  const gender = typeof patient.gender === "string" ? toSentence(patient.gender) : "Unknown";
  const birthDate = typeof patient.birthDate === "string" ? new Date(patient.birthDate) : null;

  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return `${gender}, age unknown`;
  }

  const age = Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / 31557600000));
  const band =
    age < 18 ? "0-17" : age < 35 ? "18-34" : age < 50 ? "35-49" : age < 65 ? "50-64" : "65+";

  return `${gender}, ${band}`;
}

function getDiseaseLabels(payload?: Record<string, unknown>) {
  return collectFhirResources(payload)
    .filter((resource) => resource.resourceType === "Condition")
    .map((condition) => {
      const text =
        getNestedString(condition, ["code", "text"]) ??
        getNestedString(condition, ["code", "coding", "0", "display"]) ??
        getNestedString(condition, ["code", "coding", "0", "code"]);

      return text ?? "Unspecified condition";
    });
}

function countBy<T>(
  rows: T[],
  getKey: (row: T) => string | undefined,
  limit = 6,
): ChartRow[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const key = getKey(row)?.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function statusTone(value: number) {
  if (value >= 95) {
    return "success";
  }

  if (value >= 80) {
    return "warning";
  }

  return "danger";
}

function AnalyticsCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const tones = {
    neutral: "text-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)]",
    success: "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,white)]",
    danger: "text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,white)]",
    warning: "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,white)]",
  };

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {value}
          </p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-[var(--radius-md)] ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-[1.5] text-[var(--text-secondary)]">{detail}</p>
    </section>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function NoChartData({ label = "No analytics data for this filter." }: { label?: string }) {
  return (
    <div className="grid h-full min-h-56 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--background)] px-4 text-center text-sm text-[var(--text-secondary)]">
      {label}
    </div>
  );
}

function signalColor(name: string, theme: SignalTheme) {
  const normalized = name.toLowerCase();

  if (theme === "resource") {
    if (normalized.includes("patient")) return "#2563eb";
    if (normalized.includes("bundle")) return "#7c3aed";
    if (normalized.includes("condition")) return "#dc2626";
    if (normalized.includes("observation")) return "#0891b2";
    if (normalized.includes("encounter")) return "#16a34a";
  }

  if (theme === "profile") {
    if (normalized.includes("female")) return "#db2777";
    if (normalized.includes("male")) return "#2563eb";
    if (normalized.includes("unknown")) return "#64748b";
    if (normalized.includes("0-17")) return "#f59e0b";
  }

  if (normalized.includes("malaria")) return "#dc2626";
  if (normalized.includes("hypertension")) return "#7c3aed";
  if (normalized.includes("diabetes")) return "#0891b2";
  if (normalized.includes("asthma")) return "#16a34a";
  if (normalized.includes("tuberculosis")) return "#b45309";
  if (normalized.includes("cholera")) return "#0d9488";
  if (normalized.includes("hiv")) return "#e11d48";

  return theme === "resource" ? "#475569" : theme === "profile" ? "#4a1d5f" : "#dc2626";
}

function signalInitial(name: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s+-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  if (parts[0].length <= 2 && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [timePreset, setTimePreset] = useState<TimePreset>("today");
  const [institutionId, setInstitutionId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logsAvailable, setLogsAvailable] = useState(true);
  const firstLoadRef = useRef(true);

  const range = useMemo(() => resolveRange(timePreset), [timePreset]);

  const filters = useMemo<DashboardMetricFilters>(() => {
    const next: DashboardMetricFilters = {};

    if (range.from) {
      next.created_after = range.from.toISOString();
    }

    if (range.to) {
      next.created_before = range.to.toISOString();
    }

    if (institutionId !== "all") {
      next.institution = Number(institutionId);
    }

    return next;
  }, [institutionId, range.from, range.to]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (firstLoadRef.current) {
        setLoading(true);
      }

      setError("");

      const [metricsResult, summaryResult, institutionResult, failedResult, logResult] =
        await Promise.allSettled([
          getMetrics(filters),
          getAnalyticsSummary(filters),
          getInstitutions(),
          getFailedRecords(),
          getProcessingLogs(filters),
        ]);

      if (!active) {
        return;
      }

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      } else {
        setError("Dashboard metrics could not be loaded.");
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      }

      if (institutionResult.status === "fulfilled") {
        setInstitutions(institutionResult.value);
      }

      if (failedResult.status === "fulfilled") {
        setFailedRecords(failedResult.value);
      }

      if (logResult.status === "fulfilled") {
        setLogs(logResult.value);
        setLogsAvailable(true);
      } else {
        setLogs([]);
        setLogsAvailable(false);
      }

      firstLoadRef.current = false;
      setLoading(false);
    }

    load();

    const interval = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filters]);

  const filteredFailures = useMemo(() => {
    return failedRecords.filter((record) => {
      const institutionMatches =
        institutionId === "all" || record.institution === Number(institutionId);
      return institutionMatches && inRange(record.created_at, range.from, range.to);
    });
  }, [failedRecords, institutionId, range.from, range.to]);

  const filteredLogs = useMemo(() => {
    return logs.filter((record) => {
      const institutionMatches =
        institutionId === "all" || record.institution === Number(institutionId);
      return institutionMatches && inRange(record.created_at, range.from, range.to);
    });
  }, [institutionId, logs, range.from, range.to]);

  const successfulCount = logsAvailable ? filteredLogs.length : metrics?.total_successful ?? 0;
  const failedCount = logsAvailable ? filteredFailures.length : metrics?.total_failed ?? 0;
  const receivedCount = logsAvailable
    ? successfulCount + failedCount
    : metrics?.total_received ?? successfulCount + failedCount;
  const successRate = receivedCount > 0 ? (successfulCount / receivedCount) * 100 : 0;
  const activeSystems = new Set([
    ...filteredLogs.map((record) => record.institution_name),
    ...filteredFailures.map((record) => record.institution_name),
  ]).size;

  const statusData = [
    { name: "Successful", value: successfulCount, fill: palette.successful },
    { name: "Failed", value: failedCount, fill: palette.failed },
  ].filter((item) => item.value > 0);

  const derivedTimelineData = useMemo(() => {
    const counts = new Map<string, { name: string; successful: number; failed: number }>();

    filteredLogs.forEach((record) => {
      const key = dateKey(record.created_at);
      const current = counts.get(key) ?? { name: key, successful: 0, failed: 0 };
      current.successful += 1;
      counts.set(key, current);
    });

    filteredFailures.forEach((record) => {
      const key = dateKey(record.created_at);
      const current = counts.get(key) ?? { name: key, successful: 0, failed: 0 };
      current.failed += 1;
      counts.set(key, current);
    });

    return Array.from(counts.values());
  }, [filteredFailures, filteredLogs]);

  const timelineData = summary?.transaction_trend?.length
    ? summary.transaction_trend.map((row) => ({
        name: dateKey(row.date),
        successful: row.successful,
        failed: row.failed,
      }))
    : derivedTimelineData;

  const failureStageData = (summary?.failure_stages?.length ? summary.failure_stages : countBy(filteredFailures, (record) =>
    toSentence(record.failure_stage),
  )).map((item, index) => ({
    ...item,
    fill: [palette.failed, palette.warning, palette.violet, palette.cyan, palette.slate][index % 5],
  }));

  const systemData = summary?.system_exchange_volume?.length ? summary.system_exchange_volume : countBy(
    [
      ...filteredLogs.map((record) => ({ institution_name: record.institution_name })),
      ...filteredFailures.map((record) => ({ institution_name: record.institution_name })),
    ],
    (record) => record.institution_name,
    8,
  );

  const resourceData = summary?.resource_types?.length ? summary.resource_types : countBy(
    [
      ...filteredLogs.map((record) => ({
        resourceType: record.resource_type ?? getResourceType(record.raw_payload),
      })),
      ...filteredFailures.map((record) => ({
        resourceType: getResourceType(record.raw_payload),
      })),
    ],
    (record) => record.resourceType,
    8,
  );

  const profileData = summary?.people_profiles?.length ? summary.people_profiles : countBy(
    [
      ...filteredLogs.map((record) => record.raw_payload).filter(Boolean),
      ...filteredFailures.map((record) => record.raw_payload),
    ] as Record<string, unknown>[],
    getPatientProfile,
    8,
  );

  const diseaseData = summary?.disease_signals?.length ? summary.disease_signals : countBy(
    [
      ...filteredLogs.flatMap((record) => getDiseaseLabels(record.raw_payload)),
      ...filteredFailures.flatMap((record) => getDiseaseLabels(record.raw_payload)),
    ].map((name) => ({ name })),
    (record) => record.name,
    8,
  );

  return (
    <>
      <PageHeader
        description="Monitor FHIR adapter transaction volume, exchange partners, failure patterns, patient profiles, and clinical signals."
        eyebrow="Analytics"
        title="FHIR analytics dashboard"
      />

      {error ? <ErrorBanner message={error} /> : null}

      {!logsAvailable ? (
        <div className="mb-5">
          <StatusBadge tone="warning">
            Successful log endpoint unavailable. Some filtered charts use failed-record payloads and summary totals only.
          </StatusBadge>
        </div>
      ) : null}

      <section className="mb-5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
              Time period
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {timePresets.map((preset) => (
                <button
                  className={`min-h-10 rounded-[var(--radius-md)] border px-3 text-sm font-semibold transition ${
                    timePreset === preset.value
                      ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-[var(--primary)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
                  }`}
                  key={preset.value}
                  onClick={() => setTimePreset(preset.value)}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--primary)]" />
              System
            </span>
            <select
              className={inputClass}
              onChange={(event) => setInstitutionId(event.target.value)}
              value={institutionId}
            >
              <option value="all">All systems</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          detail="Transactions handled for the selected filters."
          icon={Database}
          label="Transactions handled"
          value={loading ? "-" : formatNumber(receivedCount)}
        />
        <AnalyticsCard
          detail={`${formatNumber(successfulCount)} of ${formatNumber(receivedCount)} have gone through.`}
          icon={Activity}
          label="Gone through"
          tone={statusTone(successRate)}
          value={loading ? "-" : formatPercent(successRate)}
        />
        <AnalyticsCard
          detail={`${formatNumber(filteredFailures.filter((record) => !record.resolved).length)} open failures need review.`}
          icon={AlertTriangle}
          label="Failed"
          tone={failedCount > 0 ? "danger" : "success"}
          value={loading ? "-" : formatNumber(failedCount)}
        />
        <AnalyticsCard
          detail={`${formatNumber(institutions.filter((item) => item.is_active).length)} systems are registered as active.`}
          icon={Building2}
          label="Exchanging systems"
          value={loading ? "-" : formatNumber(activeSystems)}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <ChartPanel
          description="Successful and failed exchanges across the selected period."
          title="Transaction trend"
        >
          <div className="h-72">
            {timelineData.length === 0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={timelineData} margin={{ bottom: 0, left: -18, right: 8, top: 8 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    dataKey="successful"
                    fill="rgba(22,163,74,0.14)"
                    stroke={palette.successful}
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area
                    dataKey="failed"
                    fill="rgba(220,38,38,0.12)"
                    stroke={palette.failed}
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartPanel>

        <ChartPanel
          description="Percentage that went through versus failed."
          title="Outcome mix"
        >
          <div className="h-72">
            {statusData.length === 0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={statusData}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name) => [formatNumber(Number(value)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 grid gap-2 text-xs text-[var(--text-secondary)]">
            {statusData.map((item) => (
              <div className="flex items-center justify-between gap-3" key={item.name}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ChartPanel
          description="What failed, grouped by adapter stage."
          title="Failure stages"
        >
          <div className="h-72">
            {failureStageData.length === 0 ? (
              <NoChartData label="No failed records for this filter." />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={failureStageData} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.18)" />
                  <XAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis dataKey="name" hide type="category" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {failureStageData.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartPanel>

        <ChartPanel
          description="How many system instances are exchanging information."
          title="System exchange volume"
        >
          <div className="h-72">
            {systemData.length === 0 ? (
              <NoChartData />
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={systemData} margin={{ bottom: 8, left: -18, right: 8, top: 8 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="name"
                    interval={0}
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill={palette.cyan} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ChartPanel
          description="Key FHIR datapoints sent through the adapter."
          title="FHIR resource types"
        >
          {resourceData.length === 0 ? (
            <EmptyState
              description="FHIR resource metadata will appear once payloads or logs include resource types."
              title="No resource signals"
            />
          ) : (
            <SignalList data={resourceData} icon={BarChart3} theme="resource" />
          )}
        </ChartPanel>

        <ChartPanel
          description="Patient profile mix inferred from FHIR Patient payloads."
          title="People profiles"
        >
          {profileData.length === 0 ? (
            <EmptyState
              description="Profiles need FHIR Patient resources with gender and birth date fields."
              title="No profile signals"
            />
          ) : (
            <SignalList data={profileData} icon={Users} theme="profile" />
          )}
        </ChartPanel>

        <ChartPanel
          description="Disease patterns inferred from FHIR Condition resources."
          title="Disease signals"
        >
          {diseaseData.length === 0 ? (
            <EmptyState
              description="Disease analytics need FHIR Condition resources in processed payloads."
              title="No disease signals"
            />
          ) : (
            <SignalList data={diseaseData} icon={HeartPulse} theme="disease" />
          )}
        </ChartPanel>
      </div>
    </>
  );
}

function SignalList({
  data,
  icon: Icon,
  theme,
}: {
  data: ChartRow[];
  icon: typeof Activity;
  theme: SignalTheme;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex items-center justify-between gap-3 px-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
        <span>Signal</span>
        <span>Count</span>
      </div>
      {data.map((item, index) => {
        const color = item.fill ?? signalColor(item.name, theme);
        const width = `${Math.max(8, (item.value / max) * 100)}%`;

        return (
          <div
            className="group relative grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-2.5 py-1.5 transition"
            key={item.name}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] transition-[width] duration-300 ease-out group-hover:bg-[color-mix(in_srgb,var(--foreground)_9%,transparent)]"
              style={{ width }}
            />
            <span className="relative z-10 inline-flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[10px] font-bold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, white)`,
                  color,
                }}
              >
                {index < 3 ? <Icon className="h-4 w-4" /> : signalInitial(item.name)}
              </span>
              <span className="min-w-0 truncate">{item.name}</span>
            </span>
            <span className="relative z-10 justify-self-end text-sm font-semibold tabular-nums text-[var(--text-secondary)]">
              {formatNumber(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
