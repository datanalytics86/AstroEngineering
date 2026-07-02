"use client";

/**
 * MundaneTimelineChart — cronología SVG (ene→dic) de las configuraciones
 * mundiales de un año. Un marcador por configuración en su fecha exacta;
 * anti-solape por carriles verticales cuando coinciden fechas. Click
 * selecciona la configuración (misma selección que las tarjetas de la
 * página). SVG puro, sin librerías de charts.
 */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import type { MundaneConfiguration } from "@/lib/types";
import { SIGN_NAMES, SIGN_SYMBOLS } from "@/lib/wheel-geometry";
import { ASPECT_LINE_COLOR, ASPECT_SYMBOL, INGRESS_COLOR } from "@/components/MundaneWheel";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/mundane-corpus";

interface Props {
  configs: MundaneConfiguration[];
  year: number;
  selectedId: string;
  onSelect: (id: string) => void;
  lang: Lang;
}

const WIDTH = 1000;
const MARGIN_X = 28;
const ROW_H = 30;
const AXIS_Y_OFFSET = 22; // espacio para etiquetas de mes bajo el eje
const MARKER_R = 10;

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dayOfYearFraction(dateStr: string, year: number): number {
  const d = parseLocalDate(dateStr);
  const start = new Date(year, 0, 1);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const diffDays = (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(1, Math.max(0, diffDays / totalDays));
}

function configLabel(c: MundaneConfiguration): string {
  if (c.kind === "aspect" && c.bodies.length === 2) {
    const symbolA = c.sky.find((s) => s.name === c.bodies[0])?.symbol ?? "";
    const symbolB = c.sky.find((s) => s.name === c.bodies[1])?.symbol ?? "";
    return `${symbolA}${c.aspect ? ASPECT_SYMBOL[c.aspect] ?? "" : ""}${symbolB}`;
  }
  if (c.kind === "ingress" && c.bodies.length === 1) {
    const symbolBody = c.sky.find((s) => s.name === c.bodies[0])?.symbol ?? "";
    const signIdx = c.sign ? SIGN_NAMES.indexOf(c.sign as (typeof SIGN_NAMES)[number]) : -1;
    const signSymbol = signIdx >= 0 ? SIGN_SYMBOLS[signIdx] : "";
    return `${symbolBody}→${signSymbol}`;
  }
  return "";
}

function configColor(c: MundaneConfiguration): string {
  if (c.kind === "ingress") return INGRESS_COLOR;
  return (c.aspect && ASPECT_LINE_COLOR[c.aspect]) || "#334155";
}

interface Tooltip { x: number; y: number; title: string; date: string }

export default function MundaneTimelineChart({ configs, year, selectedId, onSelect, lang }: Props) {
  const { t } = useT();
  const dateLocale = lang === "en" ? enUS : esLocale;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 15);
      return { i, label: format(d, "MMM", { locale: dateLocale }), x: MARGIN_X + ((i + 0.5) / 12) * (WIDTH - 2 * MARGIN_X) };
    });
  }, [year, dateLocale]);

  const placed = useMemo(() => {
    const sorted = [...configs].sort((a, b) => a.exact_date.localeCompare(b.exact_date));
    const lastXPerLane: number[] = [];
    const minGap = 24;
    return sorted.map((c) => {
      const x = MARGIN_X + dayOfYearFraction(c.exact_date, year) * (WIDTH - 2 * MARGIN_X);
      let lane = 0;
      while (lastXPerLane[lane] !== undefined && x - lastXPerLane[lane] < minGap) {
        lane += 1;
      }
      lastXPerLane[lane] = x;
      return { config: c, x, lane };
    });
  }, [configs, year]);

  const maxLane = placed.reduce((m, p) => Math.max(m, p.lane), 0);
  const height = AXIS_Y_OFFSET + (maxLane + 1) * ROW_H + 30;
  const baseY = height - AXIS_Y_OFFSET - 6;

  function showTip(e: React.MouseEvent<SVGElement>, title: string, date: string) {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const sx = WIDTH / rect.width;
    setTooltip({ x: (e.clientX - rect.left) * sx, y: 0, title, date });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.timeline.title")}</p>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" style={{ fontFamily: "monospace" }}>
        {/* Eje horizontal */}
        <line x1={MARGIN_X} y1={baseY} x2={WIDTH - MARGIN_X} y2={baseY} stroke="#E2E8F0" strokeWidth={1} />
        {months.map((m) => (
          <g key={m.i}>
            <line x1={m.x} y1={baseY} x2={m.x} y2={baseY + 4} stroke="#CBD5E1" strokeWidth={1} />
            <text x={m.x} y={baseY + 16} textAnchor="middle" fontSize={11} fill="#64748B" className="select-none">
              {m.label}
            </text>
          </g>
        ))}

        {placed.map(({ config: c, x, lane }) => {
          const y = baseY - 10 - lane * ROW_H;
          const color = configColor(c);
          const active = c.id === selectedId;
          const label = configLabel(c);
          return (
            <g key={c.id} className="cursor-pointer" onClick={() => onSelect(c.id)}
              onMouseEnter={(e) => showTip(e, label, c.exact_date)}
              onMouseLeave={() => setTooltip(null)}>
              <line x1={x} y1={y} x2={x} y2={baseY} stroke={color} strokeWidth={1} opacity={0.35} />
              {active && <circle cx={x} cy={y} r={MARKER_R + 4} fill="none" stroke={color} strokeWidth={2} opacity={0.6} />}
              <circle cx={x} cy={y} r={MARKER_R} fill={color} opacity={0.92} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white" fontWeight="700" className="select-none pointer-events-none">
                {label.length > 3 ? label.slice(0, 3) : label}
              </text>
              {c.analogs.length > 0 && (
                <g>
                  <circle cx={x + 11} cy={y - 11} r={7} fill="#EEF2FF" stroke="#6366F1" strokeWidth={1} />
                  <text x={x + 11} y={y - 11} textAnchor="middle" dominantBaseline="central" fontSize={7} fill="#4F46E5" fontWeight="700" className="select-none pointer-events-none">
                    ★{c.analogs.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {tooltip && (() => {
          const first = placed.find((p) => p.config.exact_date === tooltip.date);
          const tx = Math.min(Math.max(first?.x ?? WIDTH / 2, 90), WIDTH - 90);
          const ty = Math.max((baseY - 10 - (first?.lane ?? 0) * ROW_H) - 46, 4);
          let dateStr = tooltip.date;
          try { dateStr = format(parseLocalDate(tooltip.date), "d MMM yyyy", { locale: dateLocale }); } catch { /* keep */ }
          return (
            <g>
              <rect x={tx - 80} y={ty} width={160} height={36} rx={5} fill="#1E293B" opacity={0.94} />
              <text x={tx} y={ty + 14} textAnchor="middle" fontSize={11} fill="white" fontWeight="600">{tooltip.title}</text>
              <text x={tx} y={ty + 27} textAnchor="middle" fontSize={9} fill="#94A3B8">{dateStr}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
