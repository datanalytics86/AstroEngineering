"use client";

/**
 * MundaneWheel — rueda de astrología mundial (SVG puro, sin D3).
 *
 * Muestra el "cielo" (cuerpos lentos + Sol) de una configuración mundial y
 * resalta el aspecto definitorio entre los dos cuerpos protagonistas. Acepta
 * opcionalmente `natalPlanets` para dibujar una birueda (natal interior +
 * mundial exterior) en el modo "impacto en mi carta".
 *
 * Reutiliza los helpers de lib/wheel-geometry.ts y el estilo de esfera 3D +
 * tooltip de TransitZodiacWheel.tsx.
 */

import { useMemo, useState } from "react";
import type { MundaneSkyBody, PlanetPosition } from "@/lib/types";
import {
  SIGN_SYMBOLS,
  SIGN_NAMES,
  SIGN_ELEMENT_COLOR,
  SIGN_ELEMENT_BG,
  makeToAngle,
  polarXY,
  describeSector,
} from "@/lib/wheel-geometry";

interface Props {
  sky: MundaneSkyBody[];
  /** Los dos cuerpos protagonistas del aspecto (para resaltar la línea). */
  highlightBodies?: string[];
  highlightAspect?: string | null;
  /** Signo de ingreso a resaltar (kind = "ingress"). */
  highlightSign?: string | null;
  /** Anillo natal opcional (modo impacto). */
  natalPlanets?: PlanetPosition[];
  /**
   * Cielo de un análogo histórico a superponer en un anillo interior (gris,
   * más pequeño) mientras `sky` permanece a color en el anillo exterior —
   * comparación de época sin perder el cielo actual de vista. Mutuamente
   * excluyente con `natalPlanets` (el llamador decide cuál mostrar).
   */
  overlaySky?: MundaneSkyBody[];
}

const SVG_SIZE = 560;
const cx = SVG_SIZE / 2;
const cy = SVG_SIZE / 2;

const R_ZODIAC_OUT = 270;
const R_ZODIAC_IN = 222;

// Anillo mundial (cuerpos lentos)
const R_MU_NEEDLE_OUT = 220;
const R_MU_NEEDLE_IN = 202;
const R_MU_GLYPH = 192;
const R_MU_DEGREE = 178;

// Separador + anillo natal opcional
const R_SEP = 172;
const R_NA_GLYPH = 148;
const R_NA_DEGREE = 136;
const R_NA_NEEDLE_OUT = 170;
const R_NA_NEEDLE_IN = 158;

const R_CORE = 96;
const R_CENTER = 24;
const R_SPHERE = 10;

export const BODY_COLORS: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981", Marte: "#EF4444",
  Sol: "#F97316", Luna: "#64748B", Mercurio: "#6366F1", Venus: "#EC4899",
};

export const ASPECT_LINE_COLOR: Record<string, string> = {
  Conjunción: "#334155", Oposición: "#DC2626", Cuadratura: "#EA580C",
  Trígono: "#2563EB", Sextil: "#16A34A",
};

export const ASPECT_SYMBOL: Record<string, string> = {
  Conjunción: "☌", Oposición: "☍", Cuadratura: "□", Trígono: "△", Sextil: "⚹",
};

/** Color de acento para ingresos de signo (no son un "aspecto", usan el acento indigo del módulo). */
export const INGRESS_COLOR = "#4F46E5";

const ASC_LON = 0; // rueda mundial: 0° Aries a la izquierda

interface Tooltip { x: number; y: number; text: string; sub: string }

function resolveCollisions<T extends { longitude: number }>(
  bodies: T[],
  minAngDeg = 7,
): (T & { rOffset: number })[] {
  const sorted = [...bodies].sort((a, b) => a.longitude - b.longitude);
  const offsets: number[] = new Array(sorted.length).fill(0);
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const diff = (next.longitude - sorted[i].longitude + 360) % 360;
    if (diff < minAngDeg && offsets[i] === 0 && offsets[(i + 1) % sorted.length] === 0) {
      offsets[(i + 1) % sorted.length] = -18;
    }
  }
  return sorted.map((p, i) => ({ ...p, rOffset: offsets[i] }));
}

export default function MundaneWheel({
  sky,
  highlightBodies,
  highlightAspect,
  highlightSign,
  natalPlanets,
  overlaySky,
}: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const toAngle = useMemo(() => makeToAngle(ASC_LON), []);

  const zodiacSectors = useMemo(() =>
    SIGN_NAMES.map((name, i) => {
      const startDeg = toAngle(i * 30);
      return { name, i, startDeg, endDeg: startDeg + 30, symbol: SIGN_SYMBOLS[i] };
    }),
  [toAngle]);

  const ticks = useMemo(() => {
    const result: { p1: { x: number; y: number }; p2: { x: number; y: number }; w: number; c: string }[] = [];
    for (let d = 0; d < 360; d++) {
      const ang = toAngle(d);
      const len = d % 10 === 0 ? 10 : d % 5 === 0 ? 6 : 3;
      result.push({
        p1: polarXY(cx, cy, R_ZODIAC_OUT, ang),
        p2: polarXY(cx, cy, R_ZODIAC_OUT - len, ang),
        w: d % 10 === 0 ? 0.8 : 0.4,
        c: d % 10 === 0 ? "#CBD5E1" : "#E2E8F0",
      });
    }
    return result;
  }, [toAngle]);

  const muDots = useMemo(() => resolveCollisions(sky), [sky]);
  const natalDots = useMemo(
    () => (natalPlanets ? resolveCollisions(natalPlanets) : []),
    [natalPlanets],
  );
  const overlayDots = useMemo(
    () => (overlaySky ? resolveCollisions(overlaySky) : []),
    [overlaySky],
  );

  // Línea del aspecto definitorio entre los dos cuerpos protagonistas
  const highlightLine = useMemo(() => {
    if (!highlightBodies || highlightBodies.length !== 2) return null;
    const a = sky.find((b) => b.name === highlightBodies[0]);
    const b = sky.find((b2) => b2.name === highlightBodies[1]);
    if (!a || !b) return null;
    const p1 = polarXY(cx, cy, R_CORE, toAngle(a.longitude));
    const p2 = polarXY(cx, cy, R_CORE, toAngle(b.longitude));
    return { p1, p2, color: ASPECT_LINE_COLOR[highlightAspect ?? ""] ?? "#334155" };
  }, [highlightBodies, highlightAspect, sky, toAngle]);

  // Sector resaltado para un ingreso de signo
  const highlightSector = useMemo(() => {
    if (!highlightSign) return null;
    const idx = SIGN_NAMES.indexOf(highlightSign as (typeof SIGN_NAMES)[number]);
    if (idx < 0) return null;
    const startDeg = toAngle(idx * 30);
    return describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, startDeg + 30);
  }, [highlightSign, toAngle]);

  function showTip(e: React.MouseEvent<SVGElement>, text: string, sub: string) {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const sx = SVG_SIZE / rect.width;
    const sy = SVG_SIZE / rect.height;
    setTooltip({ x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy, text, sub });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[560px]" style={{ fontFamily: "monospace" }}>
        <defs>
          <radialGradient id="mu-sphere" cx="0.35" cy="0.30" r="0.75">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="38%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="100%" stopColor="#0b1220" stopOpacity={0.40} />
          </radialGradient>
          <filter id="mu-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx={0} dy={1.3} stdDeviation={1.5} floodColor="#0f172a" floodOpacity={0.35} />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* Sector resaltado (ingreso) */}
        {highlightSector && (
          <path d={highlightSector} fill="#FEF9C3" stroke="#FACC15" strokeWidth={1.2} opacity={0.7} />
        )}

        {/* Anillo zodiacal */}
        {zodiacSectors.map(({ name, startDeg, endDeg, symbol }) => {
          const mid = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, startDeg + 15);
          const color = SIGN_ELEMENT_COLOR[name] ?? "#94A3B8";
          const bg = highlightSign === name ? "transparent" : (SIGN_ELEMENT_BG[name] ?? "#F8FAFC");
          return (
            <g key={name}>
              <path d={describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, endDeg)} fill={bg} stroke="#E2E8F0" strokeWidth={0.5} />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fill={color} className="select-none pointer-events-none">{symbol}</text>
            </g>
          );
        })}

        {ticks.map((t, i) => (
          <line key={i} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y} stroke={t.c} strokeWidth={t.w} />
        ))}

        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="#CBD5E1" strokeWidth={1} />

        {/* Cuerpos mundiales (anillo exterior) */}
        {muDots.map((p) => {
          const ang = toAngle(p.longitude);
          const col = BODY_COLORS[p.name] ?? "#3B82F6";
          const isHi = highlightBodies?.includes(p.name);
          const gPos = polarXY(cx, cy, R_MU_GLYPH + p.rOffset, ang);
          const dPos = polarXY(cx, cy, R_MU_DEGREE + p.rOffset, ang);
          const nOut = polarXY(cx, cy, R_MU_NEEDLE_OUT, ang);
          const nIn = polarXY(cx, cy, R_MU_NEEDLE_IN, ang);
          const degNum = Math.floor(p.longitude % 30);
          return (
            <g key={`mu-${p.name}`}>
              <circle cx={nOut.x} cy={nOut.y} r={2.2} fill={col} />
              <line x1={nOut.x} y1={nOut.y} x2={nIn.x} y2={nIn.y} stroke={col} strokeWidth={0.7} opacity={0.6} />
              {isHi && <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE + 3.5} fill="none" stroke={col} strokeWidth={1.5} opacity={0.5} />}
              <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE} fill={col} filter="url(#mu-shadow)" />
              <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE} fill="url(#mu-sphere)" />
              {p.retrograde && <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE + 1.6} fill="none" stroke="#EF4444" strokeWidth={1.5} />}
              <text x={gPos.x} y={gPos.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#ffffff" fontWeight="700" className="select-none pointer-events-none">{p.symbol}</text>
              <text x={dPos.x} y={dPos.y} textAnchor="middle" dominantBaseline="central" fontSize={7} fill={col} opacity={0.8} className="select-none pointer-events-none">{degNum}°</text>
              <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE} fill="transparent" className="cursor-pointer"
                onMouseEnter={(e) => showTip(e, p.name, `${p.degree_display} ${p.sign}${p.retrograde ? " ℞" : ""}`)}
                onMouseLeave={() => setTooltip(null)} />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={R_SEP} fill="white" stroke="#94A3B8" strokeWidth={natalPlanets || overlaySky ? 2 : 1} />

        {/* Anillo de superposición de época (cielo del análogo, gris) */}
        {overlayDots.map((p) => {
          const ang = toAngle(p.longitude);
          const gPos = polarXY(cx, cy, R_NA_GLYPH + p.rOffset, ang);
          const dPos = polarXY(cx, cy, R_NA_DEGREE + p.rOffset, ang);
          const nOut = polarXY(cx, cy, R_NA_NEEDLE_OUT, ang);
          const nIn = polarXY(cx, cy, R_NA_NEEDLE_IN, ang);
          return (
            <g key={`ov-${p.name}`} opacity={0.85}>
              <circle cx={nOut.x} cy={nOut.y} r={2} fill="#94A3B8" />
              <line x1={nOut.x} y1={nOut.y} x2={nIn.x} y2={nIn.y} stroke="#94A3B8" strokeWidth={0.6} />
              <text x={gPos.x} y={gPos.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#94A3B8" fontWeight="600" className="cursor-pointer select-none"
                onMouseEnter={(e) => showTip(e, `${p.name} (época)`, `${p.degree_display} ${p.sign}${p.retrograde ? " ℞" : ""}`)}
                onMouseLeave={() => setTooltip(null)}>{p.symbol}</text>
              <text x={dPos.x} y={dPos.y} textAnchor="middle" dominantBaseline="central" fontSize={6} fill="#CBD5E1" className="select-none pointer-events-none">{`${Math.floor(p.longitude % 30)}°`}</text>
            </g>
          );
        })}

        {/* Anillo natal opcional (modo impacto) */}
        {natalDots.map((p) => {
          const ang = toAngle(p.longitude);
          const gPos = polarXY(cx, cy, R_NA_GLYPH + p.rOffset, ang);
          const dPos = polarXY(cx, cy, R_NA_DEGREE + p.rOffset, ang);
          const nOut = polarXY(cx, cy, R_NA_NEEDLE_OUT, ang);
          const nIn = polarXY(cx, cy, R_NA_NEEDLE_IN, ang);
          return (
            <g key={`na-${p.name}`}>
              <circle cx={nOut.x} cy={nOut.y} r={2} fill="#1E293B" />
              <line x1={nOut.x} y1={nOut.y} x2={nIn.x} y2={nIn.y} stroke="#64748B" strokeWidth={0.6} />
              <text x={gPos.x} y={gPos.y} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#1E293B" fontWeight="600" className="cursor-pointer select-none"
                onMouseEnter={(e) => showTip(e, `${p.name} natal`, `${p.degree_display} ${p.sign}`)}
                onMouseLeave={() => setTooltip(null)}>{p.symbol}</text>
              <text x={dPos.x} y={dPos.y} textAnchor="middle" dominantBaseline="central" fontSize={6.5} fill="#94A3B8" className="select-none pointer-events-none">{`${Math.floor(p.longitude % 30)}°`}</text>
            </g>
          );
        })}

        {/* Núcleo + línea de aspecto definitorio */}
        <circle cx={cx} cy={cy} r={R_CORE} fill="white" stroke="#E2E8F0" strokeWidth={1} />
        {highlightLine && (
          <line x1={highlightLine.p1.x} y1={highlightLine.p1.y} x2={highlightLine.p2.x} y2={highlightLine.p2.y}
            stroke={highlightLine.color} strokeWidth={2.2} opacity={0.85} />
        )}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 75), SVG_SIZE - 75);
          const ty = Math.max(tooltip.y - 40, 8);
          return (
            <g>
              <rect x={tx - 74} y={ty} width={148} height={38} rx={5} fill="#1E293B" opacity={0.93} />
              <text x={tx} y={ty + 13} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">{tooltip.text}</text>
              <text x={tx} y={ty + 27} textAnchor="middle" fontSize={8} fill="#94A3B8">{tooltip.sub}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
