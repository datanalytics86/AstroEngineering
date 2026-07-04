"use client";

/**
 * TransitYearTimeline — cronología anual estilo Gantt (SVG puro) de los
 * tránsitos personales de un año: una fila por planeta transitante con una
 * barra por evento desde `enters_orb` hasta `leaves_orb` (♦ en `exact_date`),
 * más una fila final "℞ rápidos" con las bandas de retrogradación de
 * Mercurio/Venus/Marte. En modo zoom (planetFilter) se muestra una fila por
 * evento con etiqueta y fechas completas.
 */

import { useMemo } from "react";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import type { TransitEvent, RetroPeriod, ImportanceLevel } from "@/lib/types";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";
import { parseLocalDate } from "@/lib/date-utils";
import { useT } from "@/lib/i18n";
import {
  RETRO_FILTER,
  ROW_ORDER,
  PLANET_SYMBOLS,
  ASPECT_SYMBOLS,
  transitEventKey,
  retroPeriodKey,
} from "@/lib/transit-timeline";

interface Props {
  transits: TransitEvent[];
  retroPeriods?: RetroPeriod[];
  year: number;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  planetFilter: string | null;
  lang: "es" | "en";
}

const WIDTH = 1000;
const LABEL_W = 92;
const PAD_RIGHT = 16;
const CHART_X0 = LABEL_W;
const CHART_X1 = WIDTH - PAD_RIGHT;
const TOP_PAD = 30; // espacio para eje de meses
const BOTTOM_PAD = 10;
const BAR_H = 16;
const BAR_GAP = 5;
const ROW_PAD = 8;
const ZOOM_ROW_H = 54;
const ZOOM_BAR_H = 20;

// Jerarquía visual por importancia (B/C): las barras críticas/altas destacan
// a plena opacidad, media/baja se atenúan — antes todas pesaban igual y la
// fila de Marte (con muchas pasadas de importancia baja) ahogaba el resto.
function importanceOpacity(importance: ImportanceLevel): number {
  if (importance === "crítica" || importance === "alta") return 1;
  if (importance === "media") return 0.75;
  return 0.5; // baja
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayFraction(dateStr: string, year: number): number {
  const d = parseLocalDate(dateStr);
  const start = new Date(year, 0, 1);
  const totalDays = isLeapYear(year) ? 366 : 365;
  const diffDays = (d.getTime() - start.getTime()) / 86400000;
  return Math.min(1, Math.max(0, diffDays / totalDays));
}

function xOf(dateStr: string, year: number): number {
  return CHART_X0 + dayFraction(dateStr, year) * (CHART_X1 - CHART_X0);
}

// Recorta una fecha al año mostrado (para tránsitos/retros que asoman fuera).
function clipYear(dateStr: string, year: number): string {
  const y = Number(dateStr.slice(0, 4));
  if (y < year) return `${year}-01-01`;
  if (y > year) return `${year}-12-31`;
  return dateStr;
}

// A diferencia de clipYear, NO recorta: una fecha exacta (♦) fuera del año
// mostrado no debe dibujarse en el borde (parecería que ocurrió el 1 ene o el
// 31 dic cuando en realidad cayó en el año vecino) — se omite directamente.
function inYear(dateStr: string, year: number): boolean {
  return Number(dateStr.slice(0, 4)) === year;
}

interface LaneItem<T> {
  item: T;
  lane: number;
}

// Empaqueta items con rango [x0,x1] en carriles verticales sin solape.
function packLanes<T>(items: T[], getX0: (t: T) => number, getX1: (t: T) => number): LaneItem<T>[] {
  const sorted = [...items].sort((a, b) => getX0(a) - getX0(b));
  const laneEnds: number[] = [];
  const out: LaneItem<T>[] = [];
  for (const it of sorted) {
    const s = getX0(it);
    const e = getX1(it);
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] > s - 3) lane += 1;
    laneEnds[lane] = Math.max(e, s + 4);
    out.push({ item: it, lane });
  }
  return out;
}

function eventLabel(t: TransitEvent): string {
  const tp = PLANET_SYMBOLS[t.transit_planet] ?? "";
  const asp = ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name;
  const np = PLANET_SYMBOLS[t.natal_planet] ?? "";
  return `${tp} ${asp} ${np}`;
}

function eventFullLabel(t: TransitEvent, natalSuffix: string): string {
  const tp = PLANET_SYMBOLS[t.transit_planet] ?? "";
  const asp = ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name;
  const np = PLANET_SYMBOLS[t.natal_planet] ?? "";
  const retro = t.transit_retrograde ? " ℞" : "";
  return `${tp} ${t.transit_planet}${retro} ${asp} ${t.aspect_name} ${np} ${t.natal_planet} ${natalSuffix}`;
}

interface ZoomRow {
  key: string;
  label: string;
  x0: number;
  x1: number;
  color: string;
  isRetro: boolean;
  startText: string;
  endText: string;
  exactX: number | null;
}

export default function TransitYearTimeline({
  transits,
  retroPeriods = [],
  year,
  selectedKey,
  onSelect,
  planetFilter,
  lang,
}: Props) {
  const { t } = useT();
  const dateLocale = lang === "en" ? enUS : esLocale;
  const now = new Date();
  const isCurrentYear = now.getFullYear() === year;
  const todayFraction = isCurrentYear
    ? (now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 / (isLeapYear(year) ? 366 : 365)
    : null;

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = new Date(year, i, 15);
        const label = format(d, "MMM", { locale: dateLocale });
        return {
          i,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          x: CHART_X0 + ((i + 0.5) / 12) * (CHART_X1 - CHART_X0),
          tickX: CHART_X0 + (i / 12) * (CHART_X1 - CHART_X0),
        };
      }),
    [year, dateLocale]
  );

  function fmt(dateStr: string): string {
    try {
      return format(parseLocalDate(dateStr), "d MMM", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  }

  const isZoomRetro = planetFilter === RETRO_FILTER;
  const isZoomPlanet = planetFilter !== null && !isZoomRetro;

  // ── Modo zoom (una fila por evento) ──────────────────────────────────────
  const zoomRows: ZoomRow[] = useMemo(() => {
    if (isZoomRetro) {
      return [...retroPeriods]
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .map((p): ZoomRow => ({
          key: retroPeriodKey(p),
          label: `${p.symbol} ${p.planet} ℞`,
          x0: xOf(clipYear(p.start_date, year), year),
          x1: xOf(clipYear(p.end_date, year), year),
          color: "#EF4444",
          isRetro: true,
          startText: fmt(p.start_date),
          endText: fmt(p.end_date),
          exactX: null,
        }));
    }
    if (isZoomPlanet) {
      const natalSuffix = t("transits.timeline.natal_suffix");
      return transits
        .filter((tr) => tr.transit_planet === planetFilter)
        .sort((a, b) => a.enters_orb.localeCompare(b.enters_orb))
        .map((tr): ZoomRow => ({
          key: transitEventKey(tr),
          label: eventFullLabel(tr, natalSuffix),
          x0: xOf(clipYear(tr.enters_orb, year), year),
          x1: xOf(clipYear(tr.leaves_orb, year), year),
          color: ASPECT_COLORS[tr.nature] ?? "#94A3B8",
          isRetro: false,
          startText: fmt(tr.enters_orb),
          endText: fmt(tr.leaves_orb),
          exactX:
            tr.exact_date && inYear(tr.exact_date.slice(0, 10), year)
              ? xOf(tr.exact_date.slice(0, 10), year)
              : null,
        }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZoomRetro, isZoomPlanet, retroPeriods, transits, planetFilter, year, lang]);

  // ── Modo "Todos" (una fila por planeta, barras apiladas por carril) ──────
  const allRows = useMemo(() => {
    if (isZoomPlanet || isZoomRetro) return { rows: [], retroPlaced: [], retroHeight: 0 };
    const rows = ROW_ORDER.filter((p) => transits.some((tr) => tr.transit_planet === p)).map(
      (planetName) => {
        const events = transits.filter((tr) => tr.transit_planet === planetName);
        const placed = packLanes(
          events,
          (tr) => xOf(clipYear(tr.enters_orb, year), year),
          (tr) => xOf(clipYear(tr.leaves_orb, year), year)
        );
        const maxLane = placed.reduce((m, p) => Math.max(m, p.lane), 0);
        const height = ROW_PAD * 2 + (maxLane + 1) * BAR_H + maxLane * BAR_GAP;
        return { planetName, placed, maxLane, height };
      }
    );

    const retroPlaced =
      retroPeriods.length > 0
        ? packLanes(
            retroPeriods,
            (p) => xOf(clipYear(p.start_date, year), year),
            (p) => xOf(clipYear(p.end_date, year), year)
          )
        : [];
    const retroMaxLane = retroPlaced.reduce((m, p) => Math.max(m, p.lane), 0);
    const retroHeight =
      retroPeriods.length > 0 ? ROW_PAD * 2 + (retroMaxLane + 1) * BAR_H + retroMaxLane * BAR_GAP : 0;

    return { rows, retroPlaced, retroHeight };
  }, [isZoomPlanet, isZoomRetro, transits, retroPeriods, year]);

  // ── Alturas totales ──────────────────────────────────────────────────────
  let totalHeight: number;
  if (isZoomPlanet || isZoomRetro) {
    totalHeight = TOP_PAD + zoomRows.length * ZOOM_ROW_H + BOTTOM_PAD;
  } else {
    const rowsHeight = allRows.rows.reduce((sum, r) => sum + r.height, 0);
    totalHeight = TOP_PAD + rowsHeight + allRows.retroHeight + BOTTOM_PAD;
  }
  totalHeight = Math.max(totalHeight, TOP_PAD + BAR_H + BOTTOM_PAD + 20);

  function toggle(key: string) {
    onSelect(selectedKey === key ? null : key);
  }

  const hasContent =
    (isZoomPlanet || isZoomRetro) ? zoomRows.length > 0 : allRows.rows.length > 0 || allRows.retroPlaced.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      {!hasContent ? (
        <p className="text-sm text-slate-400 text-center py-10">{t("transits.timeline.empty")}</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${totalHeight}`} className="w-full" style={{ fontFamily: "monospace" }}>
          <defs>
            <pattern id="retroStripes" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
              <rect width={6} height={6} fill="#FECACA" opacity={0.6} />
              <line x1={0} y1={0} x2={0} y2={6} stroke="#EF4444" strokeWidth={2} />
            </pattern>
          </defs>

          {/* Eje de meses */}
          <line x1={CHART_X0} y1={TOP_PAD - 8} x2={CHART_X1} y2={TOP_PAD - 8} stroke="#E2E8F0" strokeWidth={1} />
          {months.map((m) => (
            <g key={m.i}>
              <line x1={m.tickX} y1={TOP_PAD - 12} x2={m.tickX} y2={TOP_PAD - 4} stroke="#CBD5E1" strokeWidth={1} />
              <text x={m.x} y={TOP_PAD - 14} textAnchor="middle" fontSize={11} fill="#64748B" className="select-none">
                {m.label}
              </text>
            </g>
          ))}

          {/* Línea "hoy" */}
          {todayFraction !== null && todayFraction >= 0 && todayFraction <= 1 && (
            <line
              x1={CHART_X0 + todayFraction * (CHART_X1 - CHART_X0)}
              y1={TOP_PAD - 12}
              x2={CHART_X0 + todayFraction * (CHART_X1 - CHART_X0)}
              y2={totalHeight - BOTTOM_PAD}
              stroke="#6366F1"
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.6}
            />
          )}

          {/* ── Modo zoom ── */}
          {(isZoomPlanet || isZoomRetro) &&
            zoomRows.map((row, idx) => {
              const rowY = TOP_PAD + idx * ZOOM_ROW_H;
              const barY = rowY + (ZOOM_ROW_H - ZOOM_BAR_H) / 2;
              const selected = selectedKey === row.key;
              const w = Math.max(row.x1 - row.x0, 2);
              return (
                <g key={row.key} className="cursor-pointer" onClick={() => toggle(row.key)}>
                  <rect
                    x={row.x0}
                    y={barY}
                    width={w}
                    height={ZOOM_BAR_H}
                    rx={4}
                    fill={row.isRetro ? "url(#retroStripes)" : row.color}
                    stroke={selected ? "#4F46E5" : row.color}
                    strokeWidth={selected ? 2 : 1}
                    opacity={selected ? 1 : 0.9}
                  >
                    <title>
                      {row.label} · {row.startText} – {row.endText}
                    </title>
                  </rect>
                  {row.exactX !== null && (
                    <path
                      d={`M ${row.exactX} ${barY - 4} l 4 4 l -4 4 l -4 -4 z`}
                      fill="#1E293B"
                    />
                  )}
                  <text
                    x={(row.x0 + row.x1) / 2}
                    y={barY - 8}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#334155"
                    className="select-none pointer-events-none"
                  >
                    {row.label}
                  </text>
                  <text x={row.x0} y={barY + ZOOM_BAR_H + 13} fontSize={9} fill="#94A3B8" className="select-none pointer-events-none">
                    {row.startText}
                  </text>
                  <text
                    x={row.x1}
                    y={barY + ZOOM_BAR_H + 13}
                    textAnchor="end"
                    fontSize={9}
                    fill="#94A3B8"
                    className="select-none pointer-events-none"
                  >
                    {row.endText}
                  </text>
                </g>
              );
            })}

          {/* ── Modo "Todos" ── */}
          {!isZoomPlanet && !isZoomRetro && (() => {
            let y = TOP_PAD;
            const nodes: React.ReactNode[] = [];
            for (const row of allRows.rows) {
              const rowY = y;
              const rowCenter = rowY + row.height / 2;
              nodes.push(
                <text
                  key={`label-${row.planetName}`}
                  x={8}
                  y={rowCenter}
                  dominantBaseline="central"
                  fontSize={12}
                  fill="#334155"
                  className="select-none"
                >
                  {PLANET_SYMBOLS[row.planetName] ?? ""} {row.planetName}
                </text>
              );
              for (const { item: ev, lane } of row.placed) {
                const laneY = rowY + ROW_PAD + lane * (BAR_H + BAR_GAP);
                // Barras de Marte más finas (~70% del alto): la fila de Marte
                // acumula muchas pasadas de importancia baja y antes se veía
                // como una muralla de mini-barras del mismo peso que el resto.
                const isMars = row.planetName === "Marte";
                const barHeight = isMars ? BAR_H * 0.7 : BAR_H;
                const barY = laneY + (BAR_H - barHeight) / 2;
                const x0 = xOf(clipYear(ev.enters_orb, year), year);
                const x1 = xOf(clipYear(ev.leaves_orb, year), year);
                const w = Math.max(x1 - x0, 2);
                const key = transitEventKey(ev);
                const selected = selectedKey === key;
                const color = ASPECT_COLORS[ev.nature] ?? "#94A3B8";
                const showLabel = w > 46;
                const exactX =
                  ev.exact_date && inYear(ev.exact_date.slice(0, 10), year)
                    ? xOf(ev.exact_date.slice(0, 10), year)
                    : null;
                nodes.push(
                  <g key={key} className="cursor-pointer" onClick={() => toggle(key)}>
                    <rect
                      x={x0}
                      y={barY}
                      width={w}
                      height={barHeight}
                      rx={3}
                      fill={color}
                      stroke={selected ? "#4F46E5" : "none"}
                      strokeWidth={selected ? 2 : 0}
                      opacity={selected ? 1 : importanceOpacity(ev.importance)}
                    >
                      <title>
                        {eventLabel(ev)} {ev.natal_planet} · {fmt(ev.enters_orb)} – {fmt(ev.leaves_orb)}
                        {ev.exact_date ? ` · ${t("transits.timeline.exact")}: ${fmt(ev.exact_date.slice(0, 10))}` : ""}
                      </title>
                    </rect>
                    {exactX !== null && exactX >= x0 && exactX <= x1 && (
                      <path d={`M ${exactX} ${barY - 3} l 3.5 3.5 l -3.5 3.5 l -3.5 -3.5 z`} fill="#1E293B" opacity={0.85} />
                    )}
                    {showLabel && (
                      <text
                        x={(x0 + x1) / 2}
                        y={barY + barHeight / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={10}
                        fill="white"
                        fontWeight={700}
                        className="select-none pointer-events-none"
                      >
                        {eventLabel(ev)}
                      </text>
                    )}
                  </g>
                );
              }
              y += row.height;
            }

            // Fila ℞ rápidos
            if (allRows.retroPlaced.length > 0) {
              const rowY = y;
              const rowCenter = rowY + allRows.retroHeight / 2;
              nodes.push(
                <text
                  key="label-retro"
                  x={8}
                  y={rowCenter}
                  dominantBaseline="central"
                  fontSize={12}
                  fill="#B91C1C"
                  className="select-none"
                >
                  {t("transits.timeline.retro_row")}
                </text>
              );
              for (const { item: p, lane } of allRows.retroPlaced) {
                const barY = rowY + ROW_PAD + lane * (BAR_H + BAR_GAP);
                const x0 = xOf(clipYear(p.start_date, year), year);
                const x1 = xOf(clipYear(p.end_date, year), year);
                const w = Math.max(x1 - x0, 2);
                const key = retroPeriodKey(p);
                const selected = selectedKey === key;
                const showLabel = w > 46;
                nodes.push(
                  <g key={key} className="cursor-pointer" onClick={() => toggle(key)}>
                    <rect
                      x={x0}
                      y={barY}
                      width={w}
                      height={BAR_H}
                      rx={3}
                      fill="url(#retroStripes)"
                      stroke={selected ? "#4F46E5" : "#EF4444"}
                      strokeWidth={selected ? 2 : 1}
                      opacity={selected ? 1 : 0.9}
                    >
                      <title>
                        {p.symbol} {p.planet} ℞ · {fmt(p.start_date)} – {fmt(p.end_date)}
                      </title>
                    </rect>
                    {showLabel && (
                      <text
                        x={(x0 + x1) / 2}
                        y={barY + BAR_H / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={10}
                        fill="#7F1D1D"
                        fontWeight={700}
                        className="select-none pointer-events-none"
                      >
                        {p.symbol} ℞
                      </text>
                    )}
                  </g>
                );
              }
            }

            return nodes;
          })()}
        </svg>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
        <LegendDot color={ASPECT_COLORS.armonioso} label={t("transits.timeline.legend.harmonic")} />
        <LegendDot color={ASPECT_COLORS.tenso} label={t("transits.timeline.legend.tense")} />
        <LegendDot color={ASPECT_COLORS.neutro} label={t("transits.timeline.legend.neutral")} />
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-2.5 h-2.5 bg-slate-800" style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }} />
          {t("transits.timeline.legend.exact")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-3.5 h-2.5 rounded-sm border border-red-400" style={{ background: "repeating-linear-gradient(45deg, #FECACA, #FECACA 2px, #EF4444 2px, #EF4444 3px)" }} />
          {t("transits.timeline.legend.retro")}
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
