"use client";

/**
 * Rueda natal premium — SVG puro.
 * Misma geometría, clicks, tooltips y aspectos. Solo cambia la piel:
 * profundidad, glows, jerarquía y densidad adaptativa en mobile.
 */

import { useEffect, useId, useMemo, useState, type MouseEvent } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, ClickTarget } from "@/lib/types";
import { polarXY, makeToAngle, describeSector, SIGN_SYMBOLS, SIGN_NAMES } from "@/lib/wheel-geometry";

// ── Geometry ─────────────────────────────────────────────────────────────────
const SVG_SIZE     = 560;
const cx           = SVG_SIZE / 2;
const cy           = SVG_SIZE / 2;

const R_ZODIAC_OUT = 268;
const R_ZODIAC_IN  = 218;
const R_PLANET_OUT = R_ZODIAC_IN;
const R_PLANET_IN  = 168;
const R_DOT        = 216;
const R_NEEDLE_END = 186;
const R_GLYPH      = 196;
const R_DEG_LABEL  = 177;
const R_CHART_OUT  = R_PLANET_IN;
const R_HOUSE_NUM  = 120;
const R_ASPECT     = 88;
const R_CENTER     = 22;

// ── Design tokens (Agente 1) ─────────────────────────────────────────────────
const EL_GLYPH = [
  "var(--wheel-glyph-fire)",
  "var(--wheel-glyph-earth)",
  "var(--wheel-glyph-air)",
  "var(--wheel-glyph-water)",
] as const;

const PLANET_COLOR: Record<string, string> = {
  Sol:          "var(--ember)",
  Luna:         "var(--ink)",
  Mercurio:     "var(--accent)",
  Venus:        "var(--wheel-glyph-fire)",
  Marte:        "var(--ember)",
  Júpiter:      "var(--wheel-glyph-earth)",
  Saturno:      "var(--ink-2)",
  Urano:        "var(--accent)",
  Neptuno:      "var(--wheel-hair-mid)",
  Plutón:       "var(--wheel-hair-outer)",
  "Nodo Norte": "var(--ink-2)",
  Quirón:       "var(--accent-2)",
};

const LUMINARY = new Set(["Sol", "Luna"]);

const ASPECT_LINE_COLOR: Record<string, string> = {
  Conjunción:       "var(--ink-2)",
  Oposición:        "var(--ember)",
  Cuadratura:       "var(--accent-2)",
  Trígono:          "var(--accent)",
  Sextil:           "var(--ok)",
  Quincuncio:       "var(--ink-3)",
  Sesquicuadratura: "var(--ember)",
  "Semi-sextil":    "var(--accent)",
};

const ASPECT_LINE_WIDTH: Record<string, number> = {
  Conjunción: 1.35, Oposición: 1.25, Cuadratura: 1.15,
  Trígono: 1.05,    Sextil: 0.95,
};

const MAJOR_ASPECTS = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);
const ASPECT_BUDGET = 10;

// ── Collision resolver (intacto) ─────────────────────────────────────────────
function resolveCollisions<T extends { longitude: number }>(
  items: T[],
  minDeg = 7,
): (T & { rOffset: number })[] {
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const out = sorted.map((p) => ({ ...p, rOffset: 0 }));
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const diff    = Math.abs(out[j].longitude - out[i].longitude);
      const angDiff = Math.min(diff, 360 - diff);
      if (angDiff < minDeg) {
        if (out[i].rOffset === 0) out[i].rOffset = -12;
        if (out[j].rOffset === 0) out[j].rOffset = +12;
      }
    }
  }
  return out;
}

function pickVisibleAspects(aspects: Aspect[], highlightedPlanet?: string): Aspect[] {
  if (highlightedPlanet) {
    return aspects.filter(
      (a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet,
    );
  }
  const majors = aspects.filter((a) => MAJOR_ASPECTS.has(a.aspect_name));
  if (majors.length <= ASPECT_BUDGET) return majors;
  const tight = majors.filter((a) => a.orb < 3.5);
  if (tight.length >= 6) return tight;
  return [...majors].sort((a, b) => a.orb - b.orb).slice(0, ASPECT_BUDGET);
}

function aspectOpacity(orb: number, highlighted: boolean): number {
  if (highlighted) return 0.92;
  const tightness = Math.max(0, 1 - orb / 8);
  return 0.22 + tightness * 0.38;
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
  size?: "default" | "hero";
  className?: string;
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
  size = "default",
  className = "",
}: Props) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toAngle = useMemo(() => makeToAngle(ascendant.longitude), [ascendant.longitude]);
  const planetMap = useMemo(
    () => Object.fromEntries(planets.map((p) => [p.name, p])),
    [planets],
  );
  const resolvedPlanets = useMemo(() => resolveCollisions(planets), [planets]);
  const visibleAspects = useMemo(
    () => pickVisibleAspects(aspects, highlightedPlanet),
    [aspects, highlightedPlanet],
  );

  function showTip(e: MouseEvent<SVGElement>, text: string) {
    const svg = e.currentTarget.closest("svg") as SVGSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltip({
      x: (e.clientX - rect.left) * (SVG_SIZE / rect.width),
      y: (e.clientY - rect.top)  * (SVG_SIZE / rect.height),
      text,
    });
  }

  const anglePoints = useMemo(() => (
    [
      ascendant ? { lon: ascendant.longitude,               label: "ASC", color: "var(--ember)", obj: ascendant } : null,
      ascendant ? { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "var(--ink-3)", obj: ascendant } : null,
      midheaven ? { lon: midheaven.longitude,               label: "MC",  color: "var(--accent)", obj: midheaven } : null,
      midheaven ? { lon: (midheaven.longitude + 180) % 360, label: "IC",  color: "var(--ink-3)", obj: midheaven } : null,
    ] as Array<{ lon: number; label: string; color: string; obj: AnglePoint } | null>
  ).filter((x): x is { lon: number; label: string; color: string; obj: AnglePoint } => x !== null),
  [ascendant, midheaven]);

  const maxW = size === "hero" ? "max-w-[640px]" : "max-w-[560px]";

  return (
    <div className={`chart-wheel-enter flex items-center justify-center ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className={`w-full ${maxW}`}
        role="img"
        aria-label="Carta natal"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <radialGradient id={`${uid}-sky`} cx="50%" cy="42%" r="68%">
            <stop offset="0%" stopColor="var(--wheel-sky-0)" />
            <stop offset="58%" stopColor="var(--wheel-sky-1)" />
            <stop offset="100%" stopColor="var(--wheel-sky-2)" />
          </radialGradient>
          <radialGradient id={`${uid}-inner`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="var(--wheel-inner-0)" />
            <stop offset="100%" stopColor="var(--wheel-inner-1)" />
          </radialGradient>
          <radialGradient id={`${uid}-fire`} cx="50%" cy="50%" r="100%">
            <stop offset="0%" stopColor="var(--wheel-fire-0)" />
            <stop offset="100%" stopColor="var(--wheel-fire-1)" />
          </radialGradient>
          <radialGradient id={`${uid}-earth`} cx="50%" cy="50%" r="100%">
            <stop offset="0%" stopColor="var(--wheel-earth-0)" />
            <stop offset="100%" stopColor="var(--wheel-earth-1)" />
          </radialGradient>
          <radialGradient id={`${uid}-air`} cx="50%" cy="50%" r="100%">
            <stop offset="0%" stopColor="var(--wheel-air-0)" />
            <stop offset="100%" stopColor="var(--wheel-air-1)" />
          </radialGradient>
          <radialGradient id={`${uid}-water`} cx="50%" cy="50%" r="100%">
            <stop offset="0%" stopColor="var(--wheel-water-0)" />
            <stop offset="100%" stopColor="var(--wheel-water-1)" />
          </radialGradient>
          <filter id={`${uid}-grain`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
            <feColorMatrix type="saturate" values="0" in="n" result="g" />
            <feBlend in="SourceGraphic" in2="g" mode="overlay" />
          </filter>
          <filter id={`${uid}-disc-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3.2" floodColor="#05070c" floodOpacity="0.45" />
          </filter>
          <filter id={`${uid}-glow-sun`} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-glow-moon`} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="3.0" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-glow-asc`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft sky + outer drop */}
        <circle
          cx={cx} cy={cy} r={R_ZODIAC_OUT + 6}
          fill={`url(#${uid}-sky)`}
          filter={`url(#${uid}-disc-shadow)`}
        />

        {/* ── ZODIAC RING ── */}
        {SIGN_NAMES.map((name, i) => {
          const startDeg = toAngle(i * 30);
          const endDeg   = toAngle(i * 30 + 30);
          const midDeg   = toAngle(i * 30 + 15);
          const midPos   = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, midDeg);
          const el       = (["fire", "earth", "air", "water"] as const)[i % 4];
          return (
            <g key={name}>
              <path
                d={describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, endDeg)}
                fill={`url(#${uid}-${el})`}
                stroke="var(--line)"
                strokeWidth={0.35}
              />
              <text
                x={midPos.x} y={midPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={compact ? 17 : 18}
                fill={EL_GLYPH[i % 4]}
                fontWeight="600"
                opacity={0.92}
                className="select-none pointer-events-none"
              >
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {Array.from({ length: 12 }, (_, i) => {
          const ang = toAngle(i * 30);
          const p1  = polarXY(cx, cy, R_ZODIAC_IN,  ang);
          const p2  = polarXY(cx, cy, R_ZODIAC_OUT, ang);
          return (
            <line
              key={`div-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--wheel-tick)" strokeWidth={0.55} opacity={0.55}
            />
          );
        })}

        {/* Degree ticks — 5° desktop, 10° mobile */}
        {Array.from({ length: compact ? 36 : 72 }, (_, i) => {
          const step    = compact ? 10 : 5;
          const deg     = i * step;
          const ang     = toAngle(deg);
          const isMajor = deg % 10 === 0;
          const len     = isMajor ? 8 : 4;
          const p1      = polarXY(cx, cy, R_ZODIAC_IN,       ang);
          const p2      = polarXY(cx, cy, R_ZODIAC_IN - len, ang);
          return (
            <line
              key={`tick-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="var(--wheel-tick)"
              strokeWidth={isMajor ? 0.7 : 0.35}
              opacity={isMajor ? 0.75 : 0.45}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="none" stroke="var(--wheel-hair-outer)" strokeWidth={1.7} />
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT - 2.6} fill="none" stroke="var(--wheel-hair-mid)" strokeWidth={0.55} opacity={0.7} />
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="var(--line)" strokeWidth={1} />

        {/* ── PLANET RING ── */}
        <circle cx={cx} cy={cy} r={R_PLANET_OUT - 0.5} fill="var(--wheel-sky-1)" />
        <circle cx={cx} cy={cy} r={R_PLANET_IN} fill={`url(#${uid}-inner)`} />
        <circle cx={cx} cy={cy} r={R_PLANET_IN} fill="none" stroke="var(--line)" strokeWidth={0.8} />

        {/* ── HOUSE LINES ── */}
        {houses.map((house) => {
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const ang       = toAngle(house.cusp_longitude);
          const p1        = polarXY(cx, cy, R_CHART_OUT, ang);
          const p2        = polarXY(cx, cy, R_CENTER + 4, ang);
          const nextHouse = houses[house.number % 12];
          const nextAng   = toAngle(nextHouse.cusp_longitude);
          const span      = ((nextAng - ang) + 360) % 360;
          const midAng    = ang + span / 2;
          const numPos    = polarXY(cx, cy, R_HOUSE_NUM, midAng);

          return (
            <g key={house.number}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={isAngular ? "var(--accent)" : "var(--line)"}
                strokeWidth={isAngular ? 1.35 : 0.65}
                strokeDasharray={isAngular ? undefined : "3,3"}
                opacity={isAngular ? 0.85 : 0.9}
              />
              <text
                x={numPos.x} y={numPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={compact ? 10 : 9.5}
                fill={isAngular ? "var(--ink-2)" : "var(--ink-3)"}
                fontFamily="JetBrains Mono, monospace"
                className="cursor-pointer select-none"
                onClick={() => onElementClick?.({ type: "house", house })}
              >
                {house.number}
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
          const color = ASPECT_LINE_COLOR[asp.aspect_name] ?? "var(--ink-3)";
          const lw    = ASPECT_LINE_WIDTH[asp.aspect_name] ?? 0.7;
          const isHl  = !!highlightedPlanet &&
            (asp.planet1 === highlightedPlanet || asp.planet2 === highlightedPlanet);
          return (
            <g key={`${asp.planet1}-${asp.aspect_name}-${asp.planet2}-${i}`}>
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke={color}
                strokeWidth={isHl ? lw * 2.2 : lw}
                strokeLinecap="round"
                opacity={aspectOpacity(asp.orb, isHl)}
              />
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke="transparent" strokeWidth={12}
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

        {/* ── ASC / DSC / MC / IC axes ── */}
        {anglePoints.map(({ lon, label, color }) => {
          const ang   = toAngle(lon);
          const inner = polarXY(cx, cy, R_CENTER + 4, ang);
          const outer = polarXY(cx, cy, R_CHART_OUT, ang);
          const isMain = label === "ASC" || label === "MC";
          return (
            <g key={`axis-${label}`}>
              {label === "ASC" && (
                <circle
                  cx={outer.x} cy={outer.y} r={7}
                  fill="var(--ember)" opacity={0.22}
                  filter={`url(#${uid}-glow-asc)`}
                  className="pointer-events-none"
                />
              )}
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={color}
                strokeWidth={isMain ? 2.05 : 1.0}
                strokeLinecap="round"
                opacity={isMain ? 0.92 : 0.55}
              />
            </g>
          );
        })}

        {/* ── PLANETS ── */}
        {resolvedPlanets.map((p) => {
          const ang       = toAngle(p.longitude);
          const isHl      = highlightedPlanet === p.name;
          const color     = isHl ? "var(--accent)" : (PLANET_COLOR[p.name] ?? "var(--ink)");
          const glyphR    = R_GLYPH    + p.rOffset;
          const needleEnd = R_NEEDLE_END + p.rOffset;
          const degR      = R_DEG_LABEL + p.rOffset;
          const dotPos    = polarXY(cx, cy, R_DOT,      ang);
          const needleP   = polarXY(cx, cy, needleEnd,  ang);
          const glyphPos  = polarXY(cx, cy, glyphR,     ang);
          const degPos    = polarXY(cx, cy, degR,       ang);
          const isLum     = LUMINARY.has(p.name);
          const discR     = isHl ? 13.2 : isLum ? 12.4 : 11.4;
          const glowFilter =
            p.name === "Sol" ? `url(#${uid}-glow-sun)`
            : p.name === "Luna" ? `url(#${uid}-glow-moon)`
            : undefined;
          const showDeg = !compact || isHl;

          return (
            <g key={p.name}>
              <circle cx={dotPos.x} cy={dotPos.y} r={isLum ? 2.4 : 1.9} fill={color} opacity={0.95} />
              <line
                x1={dotPos.x} y1={dotPos.y} x2={needleP.x} y2={needleP.y}
                stroke={color} strokeWidth={isHl ? 1.15 : 0.85} opacity={isHl ? 0.8 : 0.42}
                strokeLinecap="round"
              />
              {isLum && (
                <circle
                  cx={glyphPos.x} cy={glyphPos.y} r={discR + 5.5}
                  fill={color} opacity={0.14}
                  filter={glowFilter}
                  className="pointer-events-none"
                />
              )}
              <circle
                cx={glyphPos.x} cy={glyphPos.y} r={discR}
                fill="var(--wheel-planet-disc)"
                stroke={color}
                strokeWidth={isHl ? 1.85 : 1.15}
                className="cursor-pointer"
                onClick={() => {
                  onPlanetClick?.(p.name);
                  onElementClick?.({ type: "planet", planet: p, aspects });
                }}
                onMouseEnter={(e) =>
                  showTip(e, `${p.name} ${p.degree_display} ${p.sign} · Casa ${p.house}`)
                }
                onMouseLeave={() => setTooltip(null)}
              />
              <text
                x={glyphPos.x} y={glyphPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={isHl ? 16.5 : 15.5}
                fill={color}
                fontWeight={isHl ? "700" : "500"}
                className="cursor-pointer select-none"
                onClick={() => {
                  onPlanetClick?.(p.name);
                  onElementClick?.({ type: "planet", planet: p, aspects });
                }}
                onMouseEnter={(e) =>
                  showTip(e, `${p.name} ${p.degree_display} ${p.sign} · Casa ${p.house}`)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol}
              </text>
              {showDeg && (
                <text
                  x={degPos.x} y={degPos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={6.5}
                  fill={color}
                  opacity={0.72}
                  fontFamily="JetBrains Mono, monospace"
                  className="select-none pointer-events-none"
                >
                  {Math.floor(p.degree_in_sign)}°
                </text>
              )}
              {p.retrograde && (
                <text
                  x={glyphPos.x + 11} y={glyphPos.y - 10}
                  fontSize={7.5} fill="var(--ember)" fontWeight="700"
                  className="select-none pointer-events-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── TRANSIT RING ── */}
        {transitPlanets && transitPlanets.length > 0 && (
          <>
            {transitPlanets.map((p) => {
              const ang = toAngle(p.longitude);
              const pos = polarXY(cx, cy, R_ZODIAC_IN + 16, ang);
              return (
                <text key={p.name}
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="var(--accent)" opacity={0.9}
                  className="select-none pointer-events-none"
                >
                  {p.symbol}
                </text>
              );
            })}
          </>
        )}

        {/* ── ANGLE LABELS ── */}
        {anglePoints.map(({ lon, label, color, obj }) => {
          const isMain = label === "ASC" || label === "MC";
          const ang      = toAngle(lon);
          const labelPos = polarXY(cx, cy, R_PLANET_IN + 12, ang);
          return (
            <text
              key={label}
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={isMain ? 8 : 7}
              fill={color}
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.4"
              className="cursor-pointer select-none"
              onClick={() =>
                onElementClick?.({
                  type: "angle",
                  name: label as "ASC" | "DSC" | "MC" | "IC",
                  longitude: lon,
                  sign: obj.sign,
                  degree_display: obj.degree_display,
                })
              }
              opacity={isMain ? 1 : 0.62}
              filter={label === "ASC" ? `url(#${uid}-glow-asc)` : undefined}
            >{label}</text>
          );
        })}

        {/* ── CENTER ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="var(--wheel-center)" stroke="var(--line)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R_CENTER - 6} fill="none" stroke="var(--wheel-center-ring)" strokeWidth={0.9} opacity={0.85} />

        {/* ── TOOLTIP ── */}
        {tooltip && (() => {
          const tw = Math.min(236, Math.max(128, tooltip.text.length * 5.6 + 16));
          const th = 26;
          const tx = Math.min(Math.max(tooltip.x, tw / 2 + 8), SVG_SIZE - tw / 2 - 8);
          const ty = Math.max(tooltip.y - 38, 8);
          return (
            <g className="pointer-events-none">
              <rect
                x={tx - tw / 2} y={ty} width={tw} height={th} rx={8}
                fill="var(--bg-elev)" opacity={0.94}
              />
              <text
                x={tx} y={ty + th / 2}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9.5} fill="#F8FAFC"
                fontFamily="Inter, system-ui, sans-serif"
                className="select-none"
              >{tooltip.text}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
