"use client";

/** SVG line+area chart for 12-month personal intensity (no chart libraries). */

import { useMemo, useState } from "react";
import type { IntensityPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface Props {
  data: IntensityPoint[];
  className?: string;
  height?: number;
}

const WIDTH = 720;
const MARGIN_X = 36;
const MARGIN_TOP = 18;
const MARGIN_BOTTOM = 28;

interface Tooltip {
  x: number;
  y: number;
  label: string;
  value: number;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PersonalIntensityChart({
  data,
  className = "",
  height = 200,
}: Props) {
  const { t } = useT();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const nowKey = currentMonthKey();

  const plot = useMemo(() => {
    if (!data.length) return null;

    const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
    const yMin = 0;
    const yMax = Math.max(10, ...values, 1);
    const plotW = WIDTH - 2 * MARGIN_X;
    const plotH = height - MARGIN_TOP - MARGIN_BOTTOM;
    const safeRange = yMax - yMin || 1;

    const pts = data.map((d, i) => {
      const x =
        data.length > 1
          ? MARGIN_X + (i / (data.length - 1)) * plotW
          : MARGIN_X + plotW / 2;
      const v = Number.isFinite(d.value) ? d.value : 0;
      const y = MARGIN_TOP + plotH - ((v - yMin) / safeRange) * plotH;
      return {
        x,
        y,
        month: d.month,
        value: v,
        label: d.label || d.month,
        isCurrent: d.month === nowKey,
      };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const axisY = height - MARGIN_BOTTOM;
    const areaPath =
      pts.length > 0
        ? `${linePath} L ${pts[pts.length - 1].x} ${axisY} L ${pts[0].x} ${axisY} Z`
        : "";

    // Grid lines at 0 / 5 / 10
    const gridVals = [0, 5, 10].filter((g) => g <= yMax);
    const grids = gridVals.map((g) => ({
      value: g,
      y: MARGIN_TOP + plotH - ((g - yMin) / safeRange) * plotH,
    }));

    return { pts, linePath, areaPath, axisY, grids };
  }, [data, height, nowKey]);

  if (!data.length || !plot) {
    return (
      <div
        className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center ${className}`.trim()}
        role="img"
        aria-label={t("chart.pro.intensity.empty")}
      >
        <p className="text-sm text-slate-500 font-mono leading-relaxed">
          {t("chart.pro.intensity.empty")}
        </p>
      </div>
    );
  }

  const { pts, linePath, areaPath, axisY, grids } = plot;
  const ariaLabel = t("chart.pro.intensity.aria").replace(
    "{n}",
    String(data.length)
  );

  return (
    <div className={`w-full overflow-hidden ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full h-auto max-w-full"
        role="img"
        aria-label={ariaLabel}
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        <defs>
          <linearGradient id="pi-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {grids.map((g) => (
          <g key={g.value}>
            <line
              x1={MARGIN_X}
              y1={g.y}
              x2={WIDTH - MARGIN_X}
              y2={g.y}
              stroke="#E2E8F0"
              strokeWidth={1}
              strokeDasharray={g.value === 0 ? undefined : "3 4"}
            />
            <text
              x={MARGIN_X - 8}
              y={g.y + 3}
              textAnchor="end"
              fontSize={10}
              fill="#94A3B8"
              className="select-none"
            >
              {g.value}
            </text>
          </g>
        ))}

        <line
          x1={MARGIN_X}
          y1={MARGIN_TOP}
          x2={MARGIN_X}
          y2={axisY}
          stroke="#E2E8F0"
          strokeWidth={1}
        />
        <line
          x1={MARGIN_X}
          y1={axisY}
          x2={WIDTH - MARGIN_X}
          y2={axisY}
          stroke="#E2E8F0"
          strokeWidth={1}
        />

        <path d={areaPath} fill="url(#pi-area)" />
        <path d={linePath} fill="none" stroke="#4F46E5" strokeWidth={2.25} strokeLinejoin="round" />

        {pts.map((p) => {
          const short = p.label.split(" ")[0] ?? p.month.slice(5);
          return (
            <g key={p.month}>
              <text
                x={p.x}
                y={axisY + 16}
                textAnchor="middle"
                fontSize={10}
                fill={p.isCurrent ? "#4F46E5" : "#64748B"}
                fontWeight={p.isCurrent ? 700 : 400}
                className="select-none"
              >
                {short}
              </text>
              {p.isCurrent ? (
                <>
                  <circle cx={p.x} cy={p.y} r={6} fill="#4F46E5" stroke="white" strokeWidth={2} />
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#4F46E5"
                    fontWeight={700}
                    className="select-none"
                  >
                    {p.value.toFixed(1)}
                  </text>
                </>
              ) : (
                <circle cx={p.x} cy={p.y} r={3.2} fill="#6366F1" opacity={0.7} />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() =>
                  setTooltip({ x: p.x, y: p.y, label: p.label, value: p.value })
                }
                onMouseLeave={() => setTooltip(null)}
                onFocus={() =>
                  setTooltip({ x: p.x, y: p.y, label: p.label, value: p.value })
                }
                onBlur={() => setTooltip(null)}
                tabIndex={0}
                role="img"
                aria-label={`${p.label}: ${p.value.toFixed(1)}`}
              />
            </g>
          );
        })}

        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 64), WIDTH - 64);
          const ty = Math.max(tooltip.y - 40, 8);
          return (
            <g pointerEvents="none">
              <rect x={tx - 54} y={ty} width={108} height={32} rx={5} fill="#1E293B" opacity={0.94} />
              <text x={tx} y={ty + 12} textAnchor="middle" fontSize={10} fill="white" fontWeight={600}>
                {tooltip.label}
              </text>
              <text x={tx} y={ty + 24} textAnchor="middle" fontSize={9} fill="#A5B4FC">
                {tooltip.value.toFixed(1)} / 10
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
