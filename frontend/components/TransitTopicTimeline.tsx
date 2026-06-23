"use client";

import { useMemo, useState } from "react";
import type { TransitEvent } from "@/lib/types";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";

interface Props {
  transits: TransitEvent[];
  startDate: string; // "YYYY-01-01"
  endDate: string;   // "YYYY-12-31"
  lang: "es" | "en";
}

const IMPORTANCE_HEIGHT: Record<string, number> = {
  "crítica": 10,
  alta:      7,
  media:     5,
  baja:      3,
};

export default function TransitTopicTimeline({
  transits,
  startDate,
  endDate,
  lang,
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const start = useMemo(() => new Date(startDate).getTime(), [startDate]);
  const end   = useMemo(() => new Date(endDate).getTime(),   [endDate]);
  const span  = end - start;

  const sortedTransits = useMemo(
    () => [...transits].sort((a, b) => b.score - a.score).slice(0, 15),
    [transits]
  );

  function toPercent(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((t - start) / span) * 100));
  }

  // Month axis marks
  const monthMarks = useMemo(() => {
    const marks: { label: string; pct: number }[] = [];
    const d = new Date(start);
    d.setDate(1);
    while (d.getTime() <= end) {
      marks.push({
        label: d.toLocaleDateString(lang === "en" ? "en-US" : "es", { month: "short" }),
        pct: toPercent(d.toISOString().slice(0, 10)),
      });
      d.setMonth(d.getMonth() + 1);
    }
    return marks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, lang]);

  // Today line
  const today = new Date("2026-06-23").getTime();
  const todayPct =
    today >= start && today <= end
      ? ((today - start) / span) * 100
      : null;

  if (sortedTransits.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-slate-400 text-sm font-mono">
          {lang === "en" ? "No transits to display." : "Sin tránsitos para mostrar."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Scrollable chart area */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }} className="p-4">
          {/* Month axis */}
          <div className="relative mb-2 ml-44" style={{ height: 18 }}>
            {monthMarks.map((m, idx) => (
              <span
                key={`label-${idx}`}
                className="absolute text-xs text-slate-400 font-mono -translate-x-1/2"
                style={{ left: `${m.pct}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Vertical month grid lines */}
            <div className="absolute inset-0 ml-44 pointer-events-none">
              {monthMarks.map((m, idx) => (
                <div
                  key={`vline-${idx}`}
                  className="absolute top-0 bottom-0 w-px bg-slate-100"
                  style={{ left: `${m.pct}%` }}
                />
              ))}
              {/* Today line */}
              {todayPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    left: `${todayPct}%`,
                    borderLeft: "1.5px dashed #2563EB",
                    opacity: 0.7,
                  }}
                />
              )}
            </div>

            {sortedTransits.map((transit, i) => {
              const left = toPercent(transit.enters_orb);
              const right = toPercent(transit.leaves_orb);
              const width = Math.max(right - left, 0.5);
              const exactPct = transit.exact_date
                ? toPercent(transit.exact_date.slice(0, 10))
                : null;
              const color = ASPECT_COLORS[transit.nature] ?? "#94A3B8";
              const barH = IMPORTANCE_HEIGHT[transit.importance] ?? 4;
              const isExpanded = expandedIdx === i;

              const interp = getInterpretationByComponents(
                transit.transit_planet,
                transit.aspect_name,
                transit.natal_planet,
                lang
              );

              return (
                <div key={i}>
                  {/* Bar row */}
                  <div
                    className="relative flex items-center mb-1 cursor-pointer group"
                    style={{ height: 28 }}
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    title={`${transit.transit_planet} ${transit.aspect_name} ${transit.natal_planet}`}
                  >
                    {/* Left label */}
                    <div className="w-44 shrink-0 pr-3 text-xs font-mono text-right truncate select-none">
                      <span className="text-slate-700 group-hover:text-blue-600 transition-colors">
                        {transit.transit_planet}
                      </span>
                      <span className="text-slate-400 mx-1">
                        {transit.aspect_name.slice(0, 3)}
                      </span>
                      <span className="text-slate-500">{transit.natal_planet}</span>
                      {transit.transit_retrograde && (
                        <span className="text-red-400 ml-1">℞</span>
                      )}
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative" style={{ height: 20 }}>
                      {/* Duration bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 rounded-full transition-opacity"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          height: barH,
                          backgroundColor: color,
                          opacity: isExpanded ? 0.9 : 0.65,
                        }}
                      />
                      {/* Exact date marker */}
                      {exactPct !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 rounded"
                          style={{
                            left: `${exactPct}%`,
                            backgroundColor: color,
                            opacity: 0.9,
                          }}
                          title={
                            lang === "en"
                              ? `Exact: ${transit.exact_date}`
                              : `Exacto: ${transit.exact_date}`
                          }
                        />
                      )}
                    </div>

                    {/* Importance badge */}
                    <div className="w-14 shrink-0 pl-2 text-xs font-mono text-slate-400">
                      {transit.importance === "crítica"
                        ? lang === "en" ? "crit" : "crít"
                        : transit.importance.slice(0, 4)}
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="ml-44 mb-3 mr-14 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {interp?.title ?? `${transit.transit_planet} ${transit.aspect_name} ${transit.natal_planet}`}
                        </p>
                        {transit.transit_retrograde && (
                          <span className="text-xs font-mono text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">
                            ℞ {lang === "en" ? "Retrograde" : "Retrógrado"}
                          </span>
                        )}
                      </div>
                      {interp?.detailed && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {interp.detailed}
                        </p>
                      )}
                      {interp?.advice && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-700 leading-relaxed">
                            <span className="font-semibold">
                              {lang === "en" ? "Advice: " : "Consejo: "}
                            </span>
                            {interp.advice}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 font-mono">
                        {transit.enters_orb} → {transit.leaves_orb}
                        {transit.exact_date && (
                          <span className="ml-2">
                            · {lang === "en" ? "exact" : "exacto"} {transit.exact_date}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs font-mono text-slate-400">
            <span>
              {lang === "en" ? "Thickness = intensity" : "Grosor = intensidad"}
            </span>
            <span>
              {lang === "en" ? "| = exact date" : "| = fecha exacta"}
            </span>
            {todayPct !== null && (
              <span className="text-blue-500">
                {lang === "en" ? "Today = blue line" : "Hoy = línea azul"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
