"use client";

import { useState, useMemo } from "react";
import type { MonthlyForecast, TransitEvent } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  timeline: MonthlyForecast[];
  onMonthClick?: (month: MonthlyForecast) => void;
}

// ── Colores ────────────────────────────────────────────────────────────────────
function intensityColor(score: number): string {
  if (score >= 8.0) return "#EF4444";
  if (score >= 5.0) return "#F97316";
  return "#10B981";
}

const PLANET_RING: Record<string, number> = {
  Plutón: 0, Neptuno: 1, Urano: 2, Saturno: 3, Júpiter: 4,
};
const PLANET_COLOR: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981",
};

const RING_LABELS = ["Plutón", "Neptuno", "Urano", "Saturno", "Júpiter"];
const N_RINGS = 5;

// ── Helpers polar ──────────────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const start = polar(cx, cy, r, startAngle);
  const end   = polar(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
interface Tooltip {
  x: number; y: number;
  planet: string; aspect: string; natal: string; month: string;
}

export default function TransitWheel({ timeline, onMonthClick }: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const SVG_SIZE = 520;
  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;

  // Ring geometry
  const INNER_RADIUS = 70;   // central month label ring
  const RING_WIDTH   = 30;
  const RING_GAP     = 4;
  const ringRadius = (ring: number) =>
    INNER_RADIUS + (N_RINGS - ring) * (RING_WIDTH + RING_GAP);

  const N_MONTHS = timeline.length || 12;
  const SECTOR_DEG = 360 / N_MONTHS;

  // Build arcs per transit ─────────────────────────────────────────────────────
  const arcs = useMemo(() => {
    if (!timeline.length) return [];

    // Get overall date range
    const firstDate = new Date(`${timeline[0].month}-01`);
    const lastMonth = timeline[timeline.length - 1];
    const lastDate  = new Date(`${lastMonth.month}-01`);
    lastDate.setMonth(lastDate.getMonth() + 1); // end of last month

    const totalMs = lastDate.getTime() - firstDate.getTime();

    const result: {
      planet: string; aspect: string; natal: string;
      startAngle: number; endAngle: number;
      ring: number; color: string; monthIdx: number;
    }[] = [];

    const seen = new Set<string>();

    timeline.forEach((month, mi) => {
      const sectorStart = mi * SECTOR_DEG;
      const sectorEnd   = (mi + 1) * SECTOR_DEG;

      (month.transits_active ?? []).forEach((t: TransitEvent) => {
        const ring = PLANET_RING[t.transit_planet];
        if (ring === undefined) return; // only Plutón–Júpiter on the wheel

        // Deduplicate: show each transit arc once (in the month it starts)
        const key = `${t.transit_planet}_${t.aspect_name}_${t.natal_planet}_${t.enters_orb}`;
        if (seen.has(key)) return;
        seen.add(key);

        // Compute angles from enters_orb / leaves_orb relative to month sector
        // (simplification: arc spans the sector of the month where it appears)
        const color = PLANET_COLOR[t.transit_planet] ?? "#94A3B8";

        result.push({
          planet: t.transit_planet,
          aspect: t.aspect_name,
          natal:  t.natal_planet,
          startAngle: sectorStart + 1,
          endAngle:   sectorEnd - 1,
          ring,
          color,
          monthIdx: mi,
        });
      });
    });

    return result;
  }, [timeline, SECTOR_DEG]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[520px]"
        style={{ fontFamily: "monospace" }}
      >
        {/* ── Background rings ── */}
        {Array.from({ length: N_RINGS }, (_, ring) => (
          <circle
            key={ring}
            cx={cx} cy={cy}
            r={ringRadius(ring) + RING_WIDTH / 2}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={RING_WIDTH}
          />
        ))}

        {/* ── Month sector dividers ── */}
        {timeline.map((_, mi) => {
          const angle = mi * SECTOR_DEG;
          const inner = polar(cx, cy, INNER_RADIUS - 8, angle);
          const outer = polar(cx, cy, ringRadius(0) + RING_WIDTH / 2 + 14, angle);
          return (
            <line
              key={mi}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          );
        })}

        {/* ── Month sector hit areas + labels ── */}
        {timeline.map((month, mi) => {
          const midAngle  = mi * SECTOR_DEG + SECTOR_DEG / 2;
          const labelR    = INNER_RADIUS - 30;
          const labelPos  = polar(cx, cy, labelR > 20 ? labelR : 24, midAngle);
          const isHovered = hoveredMonth === month.month;
          const color     = intensityColor(month.intensity_score);
          const shortLabel = format(new Date(`${month.month}-01`), "MMM", { locale: es });

          // Sector path for clickable area
          const sectorStart = mi * SECTOR_DEG;
          const sectorEnd   = (mi + 1) * SECTOR_DEG;
          const outerR = ringRadius(0) + RING_WIDTH / 2 + 10;
          const p1 = polar(cx, cy, INNER_RADIUS - 6, sectorStart);
          const p2 = polar(cx, cy, outerR, sectorStart);
          const p3 = polar(cx, cy, outerR, sectorEnd);
          const p4 = polar(cx, cy, INNER_RADIUS - 6, sectorEnd);
          const largeArc = SECTOR_DEG > 180 ? 1 : 0;
          const sectorPath =
            `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}` +
            ` A ${outerR} ${outerR} 0 ${largeArc} 1 ${p3.x} ${p3.y}` +
            ` L ${p4.x} ${p4.y}` +
            ` A ${INNER_RADIUS - 6} ${INNER_RADIUS - 6} 0 ${largeArc} 0 ${p1.x} ${p1.y}`;

          return (
            <g key={month.month}>
              <path
                d={sectorPath}
                fill={isHovered ? `${color}15` : "transparent"}
                className="cursor-pointer transition-colors duration-150"
                onClick={() => onMonthClick?.(month)}
                onMouseEnter={() => setHoveredMonth(month.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
              {/* Month label in center circle */}
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill={isHovered ? color : "#94A3B8"}
                fontWeight={isHovered ? "bold" : "normal"}
                className="pointer-events-none select-none"
              >
                {shortLabel}
              </text>
            </g>
          );
        })}

        {/* ── Transit arcs ── */}
        {arcs.map((arc, i) => {
          const r = ringRadius(arc.ring);
          const d = describeArc(cx, cy, r, arc.startAngle, arc.endAngle);
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={arc.color}
              strokeWidth={RING_WIDTH - 6}
              strokeLinecap="round"
              opacity={hoveredMonth && timeline[arc.monthIdx]?.month !== hoveredMonth ? 0.25 : 0.75}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={(e) => {
                const svgEl = (e.target as SVGPathElement).closest("svg")!;
                const rect  = svgEl.getBoundingClientRect();
                // Scale from CSS pixels → SVG viewport coordinates
                const scaleX = SVG_SIZE / rect.width;
                const scaleY = SVG_SIZE / rect.height;
                setTooltip({
                  x: (e.clientX - rect.left) * scaleX,
                  y: (e.clientY - rect.top)  * scaleY,
                  planet: arc.planet, aspect: arc.aspect, natal: arc.natal,
                  month: format(new Date(`${timeline[arc.monthIdx]?.month ?? ""}-01`), "MMM yyyy", { locale: es }),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onMonthClick?.(timeline[arc.monthIdx])}
            />
          );
        })}

        {/* ── Ring labels (outer) ── */}
        {RING_LABELS.map((planet, ring) => {
          const r   = ringRadius(ring) + RING_WIDTH / 2 + 18;
          const pos = polar(cx, cy, r, 0);
          return (
            <text
              key={planet}
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7.5}
              fill={PLANET_COLOR[planet]}
              fontWeight="600"
              className="select-none"
            >
              {planet.slice(0, 3).toUpperCase()}
            </text>
          );
        })}

        {/* ── Center label ── */}
        <circle cx={cx} cy={cy} r={INNER_RADIUS - 8} fill="white" stroke="#E2E8F0" strokeWidth={1} />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fontWeight="600" fill="#1E293B">
          12
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={8} fill="#94A3B8">
          meses
        </text>

        {/* ── Tooltip ── */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 80} y={tooltip.y - 44}
              width={160} height={40}
              rx={6} fill="#1E293B" opacity={0.92}
            />
            <text x={tooltip.x} y={tooltip.y - 30} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">
              {tooltip.planet} {tooltip.aspect} {tooltip.natal}
            </text>
            <text x={tooltip.x} y={tooltip.y - 16} textAnchor="middle" fontSize={8} fill="#94A3B8">
              {tooltip.month}
            </text>
          </g>
        )}
      </svg>

      {/* ── Leyenda ── */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-mono">
        {RING_LABELS.map((planet) => (
          <span key={planet} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-2 rounded-sm"
              style={{ backgroundColor: PLANET_COLOR[planet] }}
            />
            {planet}
          </span>
        ))}
        <span className="text-slate-400 ml-2">— Haz clic en un sector o arco para ver el detalle</span>
      </div>
    </div>
  );
}
