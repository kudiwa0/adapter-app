"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMetrics } from "../lib/api";
import { formatNumber, formatPercent } from "../lib/format";
import type { DashboardMetrics } from "../lib/types";
import { ErrorBanner, PageHeader } from "./ui";

const chartColorMap = {
  received: "#2563eb",
  successful: "#7c3aed",
  failed: "#ef4444",
};

const legendItems = [
  { key: "received", label: "Records received", color: chartColorMap.received },
  { key: "successful", label: "Successful", color: chartColorMap.successful },
  { key: "failed", label: "Failed", color: chartColorMap.failed },
] as const;

function CustomTooltipCursor({ x, y, width }: { x?: number; y?: number; width?: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={30}
      fill="rgba(148,163,184,0.08)"
      rx={0}
      ry={0}
    />
  );
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const metricsRef = useRef<DashboardMetrics | null>(null);

  const chartData = useMemo(() => {
    if (!metrics) {
      return [];
    }

    return [
      {
        name: "Records received",
        value: metrics.total_received,
        fill: chartColorMap.received,
      },
      {
        name: "Successful",
        value: metrics.total_successful,
        fill: chartColorMap.successful,
      },
      {
        name: "Failed",
        value: metrics.total_failed,
        fill: chartColorMap.failed,
      },
    ];
  }, [metrics]);

  const xAxisTicks = useMemo(() => {
    if (!metrics) {
      return [0, 5];
    }
    const maxVal = Math.max(
      metrics.total_received,
      metrics.total_successful,
      metrics.total_failed
    );
    const ticks = [];
    const step = 5;
    const upperLimit = Math.max(5, Math.ceil(maxVal / step) * step);
    for (let i = 0; i <= upperLimit; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [metrics]);


  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (metricsRef.current === null) {
        setLoading(true);
      }

      setError("");

      try {
        const nextMetrics = await getMetrics();

        if (!active) {
          return;
        }

        setMetrics(nextMetrics);
      } catch {
        if (active) {
          setError("Dashboard data could not be loaded.");
        }
      } finally {
        if (active && metricsRef.current === null) {
          setLoading(false);
        }
      }
    }

    load();

    const interval = setInterval(load, 3000);

    return () => {
      active = false;
      clearInterval(interval);
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

      <section className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Throughput overview</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Live totals for records, successful processing, and failed items.
            </p>
          </div>


        </div>

        <div className="space-y-3">
          <div className="h-[140px] w-full">
            {loading && !metrics ? (
              <div className="flex h-full animate-pulse items-end gap-3 rounded-[var(--radius-lg)] bg-[var(--background)] p-4">
                <div className="h-full w-1/3 rounded-[10px] bg-[var(--line)]" />
                <div className="h-4/5 w-1/3 rounded-[10px] bg-[var(--line)]" />
                <div className="h-2/5 w-1/3 rounded-[10px] bg-[var(--line)]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barSize={10}
                  barCategoryGap={18}
                  margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(148,163,184,0.18)" horizontal={false} />
                  <XAxis
                    type="number"
                    ticks={xAxisTicks}
                    domain={[0, xAxisTicks[xAxisTicks.length - 1]]}
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    hide
                  />
                  <Tooltip
                    cursor={<CustomTooltipCursor />}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "var(--line)",
                      backgroundColor: "var(--surface)",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value) => [formatNumber(Number(value ?? 0)), ""]}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {chartData.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend below graph */}
          <div className="flex flex-col gap-2 pt-1 w-1/4">
            {metrics ? (
              [
                { key: "received",   label: "Records received", color: chartColorMap.received,   value: metrics.total_received },
                { key: "successful", label: "Successful",        color: chartColorMap.successful, value: metrics.total_successful },
                { key: "failed",     label: "Failed",            color: chartColorMap.failed,      value: metrics.total_failed },
              ].map((item) => (
                <div key={item.key} className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{formatNumber(item.value)}</span>
                </div>
              ))
            ) : (
              [
                { key: "received",   label: "Records received", color: chartColorMap.received },
                { key: "successful", label: "Successful",        color: chartColorMap.successful },
                { key: "failed",     label: "Failed",            color: chartColorMap.failed },
              ].map((item) => (
                <div key={item.key} className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)]">-</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <p className="text-xl font-medium text-[var(--text-secondary)]">
                  Success rate
                </p>
                <p className="text-xl font-semibold text-[var(--text-primary)]">
                  {metrics ? formatPercent(metrics.success_rate) : "-"}
                </p>
              </div>
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                {metrics ? formatNumber(metrics.total_successful) : "-"} successful of {metrics ? formatNumber(metrics.total_received) : "-"} received
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

