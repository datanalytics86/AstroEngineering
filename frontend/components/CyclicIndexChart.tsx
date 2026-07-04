"use client";

/**
 * CyclicIndexChart — línea SVG del índice cíclico de Barbault: suma de las
 * separaciones angulares (0-180°) de los 10 pares posibles entre los 5
 * cuerpos lentos, un punto por mes. Marca el mínimo del año (concentración
 * cíclica). Los meses con una configuración mayor se marcan con pequeños
 * diamantes indigo en una franja fija sobre el eje X (no pegados a la línea,
 * para no leerse como una segunda serie de datos). Colapsable (cerrado por
 * defecto) para no competir con la cronología, que es el elemento principal
 * de la página. SVG puro, sin librerías de charts.
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
  /** Configuraciones mayores por mes ("YYYY-MM") → marcador clicable sobre la línea. */
  markers?: Record<string, { id: string; title: string }[]>;
  onSelectConfig?: (id: string) => void;
}

const WIDTH = 1000;
const MIN_WIDTH = 640; // B8: el contenedor scrollea en móvil en vez de comprimir a ilegible
const MARKER_BAND_H = 22; // franja fija de diamantes, independiente de la línea
const PLOT_HEIGHT = 180;
const HEIGHT = MARKER_BAND_H + PLOT_HEIGHT;
const MARGIN_X = 32;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 30;

interface Tooltip { x: number; y: number; label: string; value: number }

export default function CyclicIndexChart({ data, lang, markers, onSelectConfig }: Props) {
  const { t } = useT();
  const dateLocale = lang === "en" ? enUS : esLocale;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [open, setOpen] = useState(false);

  const { points, minIdx } = useMemo(() => {
    if (data.length === 0) return { points: [], minIdx: -1 };
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 10;
    const yMin = min - pad;
    const yMax = max + pad;
    const plotW = WIDTH - 2 * MARGIN_X;
    const plotH = PLOT_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
    const pts = data.map((d, i) => {
      const x = data.length > 1 ? MARGIN_X + (i / (data.length - 1)) * plotW : MARGIN_X + plotW / 2;
      const y = MARKER_BAND_H + MARGIN_TOP + plotH - ((d.value - yMin) / (yMax - yMin || 1)) * plotH;
      return { x, y, month: d.month, value: d.value };
    });
    let minI = 0;
    for (let i = 1; i < values.length; i++) if (values[i] < values[minI]) minI = i;
    return { points: pts, minIdx: minI };
  }, [data]);

  if (points.length === 0) return null;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const axisY = MARKER_BAND_H + PLOT_HEIGHT - MARGIN_BOTTOM;
  const markerY = MARKER_BAND_H / 2 + 2;

  function monthLabel(month: string): string {
    const [y, m] = month.split("-").map(Number);
    try { return format(new Date(y, (m ?? 1) - 1, 1), "MMM", { locale: dateLocale }); } catch { return month; }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.index.title")}</span>
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <>
          <div className="overflow-x-auto mt-2">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ fontFamily: "monospace", minWidth: MIN_WIDTH }}>
              <line x1={MARGIN_X} y1={MARKER_BAND_H + MARGIN_TOP} x2={MARGIN_X} y2={axisY} stroke="#E2E8F0" strokeWidth={1} />
              <line x1={MARGIN_X} y1={axisY} x2={WIDTH - MARGIN_X} y2={axisY} stroke="#E2E8F0" strokeWidth={1} />

              <path d={path} fill="none" stroke="#4F46E5" strokeWidth={2} />

              {points.map((p, i) => (
                <g key={p.month}>
                  <text x={p.x} y={axisY + 16} textAnchor="middle" fontSize={10} fill="#64748B" className="select-none">
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
                  {/* Diamante de configuración mayor — franja fija independiente de la
                      línea, para no leerse como una segunda serie de datos. */}
                  {(markers?.[p.month]?.length ?? 0) > 0 && (
                    <g
                      className="cursor-pointer"
                      onClick={() => onSelectConfig?.(markers![p.month][0].id)}
                      transform={`translate(${p.x} ${markerY}) rotate(45)`}
                    >
                      <rect x={-4} y={-4} width={8} height={8} fill="#EEF2FF" stroke="#4F46E5" strokeWidth={1.3} />
                      <title>{markers![p.month].map((m) => m.title).join("\n")}</title>
                    </g>
                  )}
                </g>
              ))}

              {tooltip && (() => {
                const tx = Math.min(Math.max(tooltip.x, 70), WIDTH - 70);
                const ty = Math.max(tooltip.y - 42, MARKER_BAND_H + 4);
                return (
                  <g>
                    <rect x={tx - 60} y={ty} width={120} height={34} rx={5} fill="#1E293B" opacity={0.94} />
                    <text x={tx} y={ty + 13} textAnchor="middle" fontSize={10} fill="white" fontWeight="600">{tooltip.label}</text>
                    <text x={tx} y={ty + 26} textAnchor="middle" fontSize={9} fill="#94A3B8">{tooltip.value.toFixed(1)}°</text>
                  </g>
                );
              })()}
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
            {t("geo.index.explain")} <span className="text-indigo-500">{t("geo.index.marker_legend")}</span>
          </p>
        </>
      )}
    </div>
  );
}
