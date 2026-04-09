"use client";

import { useMemo } from "react";
import type { TransitEvent } from "@/lib/types";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";

interface Props {
  transits: TransitEvent[];
  startDate: string;
  endDate: string;
}

export default function TransitTimeline({ transits, startDate, endDate }: Props) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const span = end - start;

  const sortedTransits = useMemo(
    () => [...transits].sort((a, b) => b.score - a.score).slice(0, 20),
    [transits]
  );

  function toPercent(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    return Math.max(0, Math.min(100, ((t - start) / span) * 100));
  }

  // Construir marcas de meses
  const monthMarks: { label: string; pct: number }[] = [];
  const d = new Date(start);
  d.setDate(1);
  while (d.getTime() <= end) {
    monthMarks.push({
      label: d.toLocaleDateString("es", { month: "short", year: "2-digit" }),
      pct: toPercent(d.toISOString().slice(0, 10)),
    });
    d.setMonth(d.getMonth() + 1);
  }

  return (
    <div className="bg-space-card border border-space-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-space-border">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 font-mono">
          Timeline de Tránsitos
        </h3>
      </div>

      <div className="p-4 overflow-x-auto">
        {/* Eje de tiempo */}
        <div className="relative mb-2" style={{ height: 20 }}>
          {monthMarks.map((m, idx) => (
            <span
              key={`label-${idx}`}
              className="absolute text-xs text-gray-600 font-mono transform -translate-x-1/2"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Líneas verticales de meses */}
        <div className="relative">
          {monthMarks.map((m, idx) => (
            <div
              key={`line-${idx}`}
              className="absolute top-0 bottom-0 border-l border-space-border border-dashed opacity-30"
              style={{ left: `${m.pct}%`, height: sortedTransits.length * 36 }}
            />
          ))}

          {/* Barras de tránsitos */}
          {sortedTransits.map((t, i) => {
            const left = toPercent(t.enters_orb);
            const right = toPercent(t.leaves_orb);
            const width = Math.max(right - left, 0.5);
            const exactPct = t.exact_date ? toPercent(t.exact_date.slice(0, 10)) : null;
            const color = ASPECT_COLORS[t.nature];

            return (
              <div key={i} className="relative flex items-center mb-1" style={{ height: 32 }}>
                {/* Label izquierdo */}
                <div className="w-48 shrink-0 pr-3 text-xs font-mono text-gray-400 text-right truncate">
                  <span className="text-gray-300">{t.transit_planet}</span>
                  <span className="text-gray-600 mx-1">{t.aspect_name.slice(0, 3)}</span>
                  <span>{t.natal_planet}</span>
                </div>

                {/* Área de la barra */}
                <div className="flex-1 relative" style={{ height: 24 }}>
                  {/* Barra de duración */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      height: Math.max(4, t.score / 2),
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                    title={`${t.transit_planet} ${t.aspect_name} ${t.natal_planet}: ${t.enters_orb} → ${t.leaves_orb}`}
                  />

                  {/* Marca de aspecto exacto */}
                  {exactPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 rounded"
                      style={{
                        left: `${exactPct}%`,
                        backgroundColor: color,
                        opacity: 1,
                      }}
                      title={`Exacto: ${t.exact_date}`}
                    />
                  )}
                </div>

                {/* Importancia */}
                <div
                  className="w-12 shrink-0 pl-2 text-xs font-mono"
                  style={{ color: IMPORTANCE_COLORS[t.importance] }}
                >
                  {t.importance.slice(0, 4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
