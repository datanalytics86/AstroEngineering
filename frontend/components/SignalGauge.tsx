"use client";

import { useEffect, useState } from "react";

interface SignalGaugeProps {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;   // 0-1
  consensus: number;    // -1..+1
  size?: "sm" | "lg";
}

const SIGNAL_COLORS = {
  LONG:    "#22C55E",
  SHORT:   "#EF4444",
  NEUTRAL: "#F59E0B",
};

const SIGNAL_LABELS = {
  LONG:    "LONG",
  SHORT:   "SHORT",
  NEUTRAL: "HOLD",
};

/** consensus ∈ [-1,+1] → needle angle ∈ [0°, 180°] on the SVG semicircle.
 *  consensus=-1 → 180° (left/SHORT), consensus=0 → 90° (top/NEUTRAL), consensus=+1 → 0° (right/LONG)
 *  Internally we keep the 0-180° arc convention from the original component.
 */
function consensusToAngle(consensus: number): number {
  const clamped = Math.max(-1, Math.min(1, consensus));
  return 90 - clamped * 90;
}

export default function SignalGauge({
  direction,
  confidence,
  consensus,
  size = "lg",
}: SignalGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const angle = mounted ? consensusToAngle(consensus) : 90;
  const color = SIGNAL_COLORS[direction];
  const label = SIGNAL_LABELS[direction];
  const confPct = Math.round(confidence * 100);

  const isSmall = size === "sm";
  const W  = isSmall ? 220 : 320;
  const H  = isSmall ? 130 : 180;
  const cx = W / 2;
  const cy = isSmall ? 98 : 140;
  const R  = isSmall ? 76 : 110;
  const strokeW  = isSmall ? 14 : 18;
  const fontSize = isSmall ? 18 : 26;

  function arcPath(startDeg: number, endDeg: number, r: number): string {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const needleRad = ((angle - 90) * Math.PI) / 180;
  const nLen = R - 8;
  const nx = cx + nLen * Math.cos(needleRad);
  const ny = cy + nLen * Math.sin(needleRad);

  const ticks = [
    { angleDeg: 180, label: "SHORT", anchor: "end"   },
    { angleDeg:  90, label: "HOLD",  anchor: "middle" },
    { angleDeg:   0, label: "LONG",  anchor: "start"  },
  ];

  // Graduated tick marks every 30°
  const gradTicks = [0, 30, 60, 90, 120, 150, 180];

  return (
    <div className="flex flex-col items-center">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-label={`Señal ${label} con confianza ${confPct}%`}
      >
        <defs>
          <filter id="glow-gauge" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-needle" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track background */}
        <path
          d={arcPath(180, 0, R)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Zone arcs — graduated opacity */}
        <path d={arcPath(180, 120, R)} fill="none" stroke="#EF4444" strokeWidth={strokeW} strokeLinecap="butt" opacity="0.55" />
        <path d={arcPath(120, 60,  R)} fill="none" stroke="#F59E0B" strokeWidth={strokeW} strokeLinecap="butt" opacity="0.55" />
        <path d={arcPath(60,   0,  R)} fill="none" stroke="#22C55E" strokeWidth={strokeW} strokeLinecap="butt" opacity="0.55" />

        {/* Active arc overlay (glow) */}
        {mounted && (
          <path
            d={arcPath(180, angle, R)}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            filter="url(#glow-gauge)"
            style={{ transition: "d 0.9s cubic-bezier(.4,0,.2,1)" }}
          />
        )}

        {/* Graduated ticks with opacity */}
        {gradTicks.map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const isMajor = deg % 90 === 0;
          const r1 = R - (isMajor ? 16 : 10);
          const r2 = R + 2;
          return (
            <line
              key={deg}
              x1={cx + r1 * Math.cos(rad)}
              y1={cy + r1 * Math.sin(rad)}
              x2={cx + r2 * Math.cos(rad)}
              y2={cy + r2 * Math.sin(rad)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={isMajor ? 1.5 : 1}
            />
          );
        })}

        {/* Label ticks */}
        {ticks.map(({ angleDeg, label: tickLabel, anchor }) => {
          const rad = ((angleDeg - 90) * Math.PI) / 180;
          const tx = cx + (R + 18) * Math.cos(rad);
          const ty = cy + (R + 18) * Math.sin(rad);
          return (
            <text
              key={tickLabel}
              x={tx}
              y={ty}
              fill="rgba(255,255,255,0.35)"
              fontSize={isSmall ? 8 : 9}
              fontFamily="JetBrains Mono, monospace"
              textAnchor={anchor as never}
              dominantBaseline="middle"
            >
              {tickLabel}
            </text>
          );
        })}

        {/* Needle */}
        <g style={{ transition: mounted ? "transform 0.9s cubic-bezier(.4,0,.2,1)" : "none" }}>
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow-needle)"
          />
          <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.3} />
          <circle cx={cx} cy={cy} r={5} fill={color} filter="url(#glow-needle)" />
          <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.9)" />
        </g>

        {/* Center verdict */}
        <text
          x={cx}
          y={cy + (isSmall ? 22 : 32)}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          filter="url(#glow-gauge)"
          style={{ transition: "fill 0.5s" }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + (isSmall ? 36 : 50)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize={isSmall ? 9 : 11}
          fontFamily="JetBrains Mono, monospace"
        >
          {confPct}% confianza
        </text>
        {!isSmall && (
          <text
            x={cx}
            y={cy + 64}
            textAnchor="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
          >
            consenso {consensus >= 0 ? "+" : ""}{(consensus * 100).toFixed(0)}%
          </text>
        )}
      </svg>
    </div>
  );
}
