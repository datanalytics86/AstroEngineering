"use client";

/**
 * CyclicIndexChart — línea SVG del índice cíclico de Barbault: suma de las
 * separaciones angulares (0-180°) de los 10 pares posibles entre los 5
 * cuerpos lentos, un punto por mes. Marca el mínimo del año (concentración
 * cíclica). SVG puro, sin librerías de charts.
 */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import type { CyclicIndexPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/mundane-corpus";

interface Props {
  data: CyclicIndexPoint[];
  lang: Lang;
}

const WIDTH = 1000;
const HEIGHT = 180;
const MARGIN_X = 32;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 30;

interface Tooltip { x: number; y: number; label: string; value: number }

export default function CyclicIndexChart({ data, lang }: Props) {
  const { t } = useT();
  const dateLocale = lang === "en" ? enUS : esLocale;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const { points, minIdx } = useMemo(() => {
    if (data.length === 0) return { points: [], minIdx: -1 };
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 10;
    const yMin = min - pad;
    const yMax = max + pad;
    const plotW = WIDTH - 2 * MARGIN_X;
    const plotH = HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
    const pts = data.map((d, i) => {
      const x = data.length > 1 ? MARGIN_X + (i / (data.length - 1)) * plotW : MARGIN_X + plotW / 2;
      const y = MARGIN_TOP + plotH - ((d.value - yMin) / (yMax - yMin || 1)) * plotH;
      return { x, y, month: d.month, value: d.value };
    });
    let minI = 0;
    for (let i = 1; i < values.length; i++) if (values[i] < values[minI]) minI = i;
    return { points: pts, minIdx: minI };
  }, [data]);

  if (points.length === 0) return null;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  function monthLabel(month: string): string {
    const [y, m] = month.split("-").map(Number);
    try { return format(new Date(y, (m ?? 1) - 1, 1), "MMM", { locale: dateLocale }); } catch { return month; }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.index.title")}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ fontFamily: "monospace" }}>
        <line x1={MARGIN_X} y1={MARGIN_TOP} x2={MARGIN_X} y2={HEIGHT - MARGIN_BOTTOM} stroke="#E2E8F0" strokeWidth={1} />
        <line x1={MARGIN_X} y1={HEIGHT - MARGIN_BOTTOM} x2={WIDTH - MARGIN_X} y2={HEIGHT - MARGIN_BOTTOM} stroke="#E2E8F0" strokeWidth={1} />

        <path d={path} fill="none" stroke="#4F46E5" strokeWidth={2} />

        {points.map((p, i) => (
          <g key={p.month}>
            <text x={p.x} y={HEIGHT - MARGIN_BOTTOM + 16} textAnchor="middle" fontSize={10} fill="#64748B" className="select-none">
              {monthLabel(p.month)}
            </text>
            {i === minIdx ? (
              <>
                <circle cx={p.x} cy={p.y} r={5.5} fill="#4F46E5" stroke="white" strokeWidth={1.5} />
                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize={10} fill="#4F46E5" fontWeight="700" className="select-none">
                  {p.value.toFixed(1)}° {t("geo.index.min_label")}
                </text>
              </>
            ) : (
              <circle cx={p.x} cy={p.y} r={3} fill="#4F46E5" opacity={0.55} />
            )}
            <circle
              cx={p.x} cy={p.y} r={9} fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, label: monthLabel(p.month), value: p.value })}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}

        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 70), WIDTH - 70);
          const ty = Math.max(tooltip.y - 42, 4);
          return (
            <g>
              <rect x={tx - 60} y={ty} width={120} height={34} rx={5} fill="#1E293B" opacity={0.94} />
              <text x={tx} y={ty + 13} textAnchor="middle" fontSize={10} fill="white" fontWeight="600">{tooltip.label}</text>
              <text x={tx} y={ty + 26} textAnchor="middle" fontSize={9} fill="#94A3B8">{tooltip.value.toFixed(1)}°</text>
            </g>
          );
        })()}
      </svg>
      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{t("geo.index.explain")}</p>
    </div>
  );
}
