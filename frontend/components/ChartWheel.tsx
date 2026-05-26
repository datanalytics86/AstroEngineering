"use client";

import { useState, useMemo } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, ClickTarget } from "@/lib/types";
import { polarXY, makeToAngle, describeSector, SIGN_SYMBOLS, SIGN_NAMES } from "@/lib/wheel-geometry";

// ── Geometry ──────────────────────────────────────────────────────────────────
const SVG_SIZE     = 640;
const cx           = SVG_SIZE / 2;
const cy           = SVG_SIZE / 2;

// Rings (all radii from center)
const R_ZODIAC_OUT = 304;   // outer edge of zodiac ring
const R_ZODIAC_IN  = 254;   // inner edge of zodiac ring  (width=50)
const R_PLANET_OUT = 254;   // = R_ZODIAC_IN
const R_PLANET_IN  = 196;   // inner edge of planet ring  (width=58)
const R_CHART_OUT  = 196;   // = R_PLANET_IN
const R_HOUSE_NUM  = 150;
const R_ASPECT     = 108;
const R_CENTER     = 28;

// Planet rendering radii
const R_DOT        = 252;   // exact-degree tick/dot on zodiac inner border
const R_LEADER_END = 230;   // where leader line terminates (near glyph)
const R_GLYPH      = 218;   // glyph center
const R_DEG_LABEL  = 204;   // GG°MM' label

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDeg(degInSign: number): string {
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const SIGN_BG: string[] = [
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",
];

const SIGN_GLYPH_COLOR: string[] = [
  "#DC2626","#16A34A","#D97706","#2563EB",
  "#DC2626","#16A34A","#D97706","#2563EB",
  "#DC2626","#16A34A","#D97706","#2563EB",
];

const PLANET_COLOR: Record<string, string> = {
  Sol:          "#D97706",
  Luna:         "#64748B",
  Mercurio:     "#6366F1",
  Venus:        "#DB2777",
  Marte:        "#DC2626",
  Júpiter:      "#059669",
  Saturno:      "#7C3AED",
  Urano:        "#0891B2",
  Neptuno:      "#2563EB",
  Plutón:       "#881337",
  "Nodo Norte": "#94A3B8",
  Quirón:       "#A78BFA",
};

const ASPECT_LINE_COLOR: Record<string, string> = {
  Conjunción:       "#475569",
  Oposición:        "#DC2626",
  Cuadratura:       "#EA580C",
  Trígono:          "#2563EB",
  Sextil:           "#059669",
  Quincuncio:       "#7C3AED",
  Sesquicuadratura: "#D97706",
  "Semi-sextil":    "#0891B2",
};

const ASPECT_LINE_WIDTH: Record<string, number> = {
  Conjunción: 1.6, Oposición: 1.5, Cuadratura: 1.3,
  Trígono: 1.1,    Sextil: 1.0,
};

// ── Angular collision resolver ────────────────────────────────────────────────
// Clusters planets within `minDeg` and fans their display angles out,
// keeping the exact-longitude dot where it is and moving the glyph.
function resolveCollisions<T extends { longitude: number }>(
  items: T[],
  minDeg = 8,
): (T & { displayAngle: number })[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const result: (T & { displayAngle: number })[] = sorted.map((p) => ({
    ...p,
    displayAngle: p.longitude,
  }));

  // Walk through, collect clusters, fan them
  let i = 0;
  while (i < result.length) {
    let j = i + 1;
    while (j < result.length && result[j].longitude - result[i].longitude < minDeg) {
      j++;
    }
    const count = j - i;
    if (count > 1) {
      const lo  = result[i].longitude;
      const hi  = result[j - 1].longitude;
      const mid = (lo + hi) / 2;
      const fan = Math.max(count * 9, minDeg + 2);
      for (let k = 0; k < count; k++) {
        result[i + k].displayAngle =
          count === 1 ? mid : mid - fan / 2 + (k * fan) / (count - 1);
      }
    }
    i = j;
  }
  return result;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: AnglePoint;
  midheaven: AnglePoint;
  aspects: Aspect[];
  transitPlanets?: { name: string; symbol: string; longitude: number; retrograde?: boolean }[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
  onElementClick?: (target: ClickTarget) => void;
  width?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChartWheel({
  planets,
  houses,
  ascendant,
  midheaven,
  aspects,
  transitPlanets,
  highlightedPlanet,
  onPlanetClick,
  onElementClick,
}: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const toAngle = useMemo(() => makeToAngle(ascendant.longitude), [ascendant.longitude]);
  const planetMap = useMemo(
    () => Object.fromEntries(planets.map((p) => [p.name, p])),
    [planets],
  );
  const resolvedPlanets = useMemo(() => resolveCollisions(planets), [planets]);

  const visibleAspects = useMemo(() => {
    const major = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);
    return highlightedPlanet
      ? aspects.filter((a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet)
      : aspects.filter((a) => major.has(a.aspect_name));
  }, [aspects, highlightedPlanet]);

  function showTip(e: React.MouseEvent<SVGElement>, text: string) {
    const svg = e.currentTarget.closest("svg") as SVGSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltip({
      x: (e.clientX - rect.left) * (SVG_SIZE / rect.width),
      y: (e.clientY - rect.top) * (SVG_SIZE / rect.height),
      text,
    });
  }

  const anglePoints = useMemo(
    () =>
      [
        ascendant ? { lon: ascendant.longitude,               label: "ASC", color: "#2563EB", obj: ascendant } : null,
        ascendant ? { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "#64748B", obj: ascendant } : null,
        midheaven ? { lon: midheaven.longitude,               label: "MC",  color: "#059669", obj: midheaven } : null,
        midheaven ? { lon: (midheaven.longitude + 180) % 360, label: "IC",  color: "#64748B", obj: midheaven } : null,
      ].filter(
        (x): x is { lon: number; label: string; color: string; obj: AnglePoint } => x !== null,
      ),
    [ascendant, midheaven],
  );

  // Pre-compute sign index for each house cusp (for cusp degree label color)
  const houseSignIndex = useMemo(
    () => houses.map((h) => Math.floor(h.cusp_longitude / 30) % 12),
    [houses],
  );

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[640px]"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* ── White base disc ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT + 3} fill="white" />

        {/* ── ZODIAC RING: colored sectors ── */}
        {SIGN_NAMES.map((name, i) => {
          const startDeg = toAngle(i * 30);
          const endDeg   = toAngle(i * 30 + 30);
          const midDeg   = toAngle(i * 30 + 15);
          const midPos   = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, midDeg);
          return (
            <g key={name}>
              <path
                d={describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, endDeg)}
                fill={SIGN_BG[i]}
                stroke="#CBD5E1"
                strokeWidth={0.3}
              />
              {/* Sign glyph */}
              <text
                x={midPos.x} y={midPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={20} fill={SIGN_GLYPH_COLOR[i]}
                fontWeight="600"
                className="select-none pointer-events-none"
              >
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {/* Sign dividers */}
        {Array.from({ length: 12 }, (_, i) => {
          const ang = toAngle(i * 30);
          const p1  = polarXY(cx, cy, R_ZODIAC_IN,  ang);
          const p2  = polarXY(cx, cy, R_ZODIAC_OUT, ang);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94A3B8" strokeWidth={0.8} />;
        })}

        {/* Fine degree scale: 360 ticks on inner zodiac border */}
        {Array.from({ length: 360 }, (_, i) => {
          const ang      = toAngle(i);
          const isMajor  = i % 10 === 0;
          const isMedium = i % 5 === 0 && !isMajor;
          const len      = isMajor ? 12 : isMedium ? 7 : 3.5;
          const p1       = polarXY(cx, cy, R_ZODIAC_IN,       ang);
          const p2       = polarXY(cx, cy, R_ZODIAC_IN - len, ang);
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isMajor ? "#64748B" : "#CBD5E1"}
              strokeWidth={isMajor ? 0.9 : isMedium ? 0.6 : 0.35}
            />
          );
        })}

        {/* Zodiac ring borders */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="none" stroke="#94A3B8" strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN}  fill="none" stroke="#94A3B8" strokeWidth={1.0} />

        {/* ── PLANET RING background ── */}
        <circle cx={cx} cy={cy} r={R_PLANET_OUT} fill="#F8FAFC" />
        <circle cx={cx} cy={cy} r={R_PLANET_IN}  fill="white" />
        <circle cx={cx} cy={cy} r={R_PLANET_IN}  fill="none" stroke="#CBD5E1" strokeWidth={0.9} />

        {/* ── HOUSE LINES + NUMBERS ── */}
        {houses.map((house, idx) => {
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const ang       = toAngle(house.cusp_longitude);
          const p1        = polarXY(cx, cy, R_CHART_OUT,     ang);
          const p2        = polarXY(cx, cy, R_CENTER + 5,    ang);
          const nextHouse = houses[house.number % 12];
          const nextAng   = toAngle(nextHouse.cusp_longitude);
          const span      = ((nextAng - ang) + 360) % 360;
          const midAng    = ang + span / 2;
          const numPos    = polarXY(cx, cy, R_HOUSE_NUM, midAng);

          // Cusp degree label in zodiac ring
          const cuspDeg     = house.cusp_longitude % 30;
          const cuspDegInt  = Math.floor(cuspDeg);
          const signIdx     = houseSignIndex[idx];
          const labelRadius = R_ZODIAC_IN + 11;
          // Slightly offset from the cusp line so it doesn't overlap
          const labelAng    = ang + 1.5;
          const labelPos    = polarXY(cx, cy, labelRadius, labelAng);

          return (
            <g key={house.number}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={isAngular ? "#3B82F6" : "#CBD5E1"}
                strokeWidth={isAngular ? 1.6 : 0.8}
                strokeDasharray={isAngular ? undefined : "3,4"}
              />
              {/* House number */}
              <text
                x={numPos.x} y={numPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={12} fill="#94A3B8"
                fontFamily="JetBrains Mono, monospace"
                className="cursor-pointer select-none"
                onClick={() => onElementClick?.({ type: "house", house })}
              >
                {house.number}
              </text>
              {/* Cusp degree in zodiac ring */}
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="start" dominantBaseline="central"
                fontSize={7.5} fill={SIGN_GLYPH_COLOR[signIdx]} opacity={0.75}
                fontFamily="JetBrains Mono, monospace"
                className="select-none pointer-events-none"
                transform={`rotate(${labelAng - 90}, ${labelPos.x}, ${labelPos.y})`}
              >
                {cuspDegInt}°
              </text>
            </g>
          );
        })}

        {/* ── ASPECT LINES ── */}
        {visibleAspects.map((asp, i) => {
          const p1 = planetMap[asp.planet1];
          const p2 = planetMap[asp.planet2];
          if (!p1 || !p2) return null;
          const a1    = toAngle(p1.longitude);
          const a2    = toAngle(p2.longitude);
          const pt1   = polarXY(cx, cy, R_ASPECT, a1);
          const pt2   = polarXY(cx, cy, R_ASPECT, a2);
          const color = ASPECT_LINE_COLOR[asp.aspect_name] ?? "#94A3B8";
          const lw    = ASPECT_LINE_WIDTH[asp.aspect_name] ?? 0.8;
          const isHl  = !!highlightedPlanet &&
            (asp.planet1 === highlightedPlanet || asp.planet2 === highlightedPlanet);
          return (
            <g key={i}>
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke={color}
                strokeWidth={isHl ? lw * 2.8 : lw}
                opacity={isHl ? 0.92 : 0.45}
              />
              {/* Wide invisible hit target */}
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke="transparent" strokeWidth={14}
                className="cursor-pointer"
                onClick={() => onElementClick?.({ type: "aspect", aspect: asp })}
                onMouseEnter={(e) =>
                  showTip(e, `${asp.planet1} ${asp.aspect_name} ${asp.planet2} (${asp.orb.toFixed(1)}°)`)
                }
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* ── ASC / DSC / MC / IC axis lines ── */}
        {anglePoints.map(({ lon, label, color }) => {
          const ang   = toAngle(lon);
          const inner = polarXY(cx, cy, R_CENTER + 5,  ang);
          const outer = polarXY(cx, cy, R_CHART_OUT,   ang);
          const isMain = label === "ASC" || label === "MC";
          return (
            <line key={`axis-${label}`}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={color} strokeWidth={isMain ? 2.0 : 1.2} opacity={0.85}
            />
          );
        })}

        {/* ── PLANETS: exact dot + leader line + glyph + degree label ── */}
        {resolvedPlanets.map((p) => {
          const exactAng   = toAngle(p.longitude);
          const displayAng = toAngle(p.displayAngle);
          const isHl       = highlightedPlanet === p.name;
          const color      = isHl ? "#1D4ED8" : (PLANET_COLOR[p.name] ?? "#1E293B");

          const dotPos     = polarXY(cx, cy, R_DOT,        exactAng);
          const leaderEnd  = polarXY(cx, cy, R_LEADER_END, displayAng);
          const glyphPos   = polarXY(cx, cy, R_GLYPH,      displayAng);
          const degPos     = polarXY(cx, cy, R_DEG_LABEL,  displayAng);

          const hasLeader = Math.abs(p.displayAngle - p.longitude) > 0.5;

          return (
            <g key={p.name}>
              {/* Exact degree dot on zodiac inner border */}
              <circle cx={dotPos.x} cy={dotPos.y} r={isHl ? 3 : 2.2} fill={color} />

              {/* Leader line from exact position to fanned glyph */}
              {hasLeader && (
                <line
                  x1={dotPos.x} y1={dotPos.y}
                  x2={leaderEnd.x} y2={leaderEnd.y}
                  stroke={color} strokeWidth={0.8} opacity={0.5}
                  strokeDasharray="2,2"
                />
              )}
              {!hasLeader && (
                <line
                  x1={dotPos.x} y1={dotPos.y}
                  x2={leaderEnd.x} y2={leaderEnd.y}
                  stroke={color} strokeWidth={0.8} opacity={0.45}
                />
              )}

              {/* Planet glyph */}
              <text
                x={glyphPos.x} y={glyphPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={isHl ? 22 : 20} fill={color}
                fontWeight={isHl ? "700" : "500"}
                className="cursor-pointer select-none"
                onClick={() => {
                  onPlanetClick?.(p.name);
                  onElementClick?.({ type: "planet", planet: p, aspects });
                }}
                onMouseEnter={(e) =>
                  showTip(e, `${p.name}  ${fmtDeg(p.degree_in_sign)} ${p.sign}  Casa ${p.house}`)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol}
              </text>

              {/* Degree / minute label */}
              <text
                x={degPos.x} y={degPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} fill={color} opacity={isHl ? 0.95 : 0.72}
                fontFamily="JetBrains Mono, monospace"
                className="select-none pointer-events-none"
              >
                {fmtDeg(p.degree_in_sign)}
              </text>

              {/* Retrograde ℞ */}
              {p.retrograde && (
                <text
                  x={glyphPos.x + 13} y={glyphPos.y - 10}
                  fontSize={9} fill="#DC2626" fontWeight="700"
                  className="select-none pointer-events-none"
                >
                  ℞
                </text>
              )}
            </g>
          );
        })}

        {/* ── TRANSIT PLANETS (optional — outer ring inside zodiac) ── */}
        {transitPlanets && transitPlanets.length > 0 &&
          transitPlanets.map((p) => {
            const ang = toAngle(p.longitude);
            const pos = polarXY(cx, cy, R_ZODIAC_IN + 18, ang);
            return (
              <text key={p.name}
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={13} fill="#60A5FA" opacity={0.92}
                className="select-none pointer-events-none"
              >
                {p.symbol}
              </text>
            );
          })
        }

        {/* ── ANGLE LABELS (ASC / DSC / MC / IC) ── */}
        {anglePoints.map(({ lon, label, color, obj }) => {
          const ang      = toAngle(lon);
          const labelPos = polarXY(cx, cy, R_PLANET_IN + 16, ang);
          const isMain   = label === "ASC" || label === "MC";
          return (
            <text
              key={label}
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={isMain ? 11 : 9} fill={color} fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              className="cursor-pointer select-none"
              opacity={isMain ? 1 : 0.7}
              onClick={() =>
                onElementClick?.({
                  type: "angle",
                  name: label as "ASC" | "DSC" | "MC" | "IC",
                  longitude: lon,
                  sign: obj.sign,
                  degree_display: obj.degree_display,
                })
              }
            >
              {label}
            </text>
          );
        })}

        {/* ── CENTER CIRCLE ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="white" stroke="#E2E8F0" strokeWidth={1.2} />

        {/* ── TOOLTIP ── */}
        {tooltip &&
          (() => {
            const tx = Math.min(Math.max(tooltip.x, 100), SVG_SIZE - 100);
            const ty = Math.max(tooltip.y - 36, 6);
            return (
              <g className="pointer-events-none">
                <rect x={tx - 96} y={ty} width={192} height={24} rx={5} fill="#1E293B" opacity={0.94} />
                <text
                  x={tx} y={ty + 12}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fill="white"
                  fontFamily="JetBrains Mono, monospace"
                  className="select-none"
                >
                  {tooltip.text}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
