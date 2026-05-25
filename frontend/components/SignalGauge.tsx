"use client";

import { useEffect, useRef, useState } from "react";

interface SignalGaugeProps {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;  // 0-1
  netScore: number;
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

/** Clamp + normalize netScore to [-1, 1] → needle angle [180°..0°] (left..right) */
function netScoreToAngle(netScore: number): number {
  const clamped = Math.max(-6, Math.min(6, netScore));
  const normalized = clamped / 6; // -1 to +1
  // -1 → 180° (full LEFT/SHORT), 0 → 90° (top/NEUTRAL), +1 → 0° (full RIGHT/LONG)
  return 90 - normalized * 90;
}

export default function SignalGauge({ direction, confidence, netScore }: SignalGaugeProps) {
  const [mounted, setMounted] = useState(false);
  const prevAngle = useRef(90);

  useEffect(() => {
    setMounted(true);
  }, []);

  const angle = mounted ? netScoreToAngle(netScore) : 90;
  const color = SIGNAL_COLORS[direction];
  const label = SIGNAL_LABELS[direction];
  const confPct = Math.round(confidence * 100);

  const cx = 160;
  const cy = 140;
  const R  = 110;

  // Gradient arc: 180° semicircle from left to right
  // We draw it as three colored arcs (red, amber, green)
  function arcPath(startDeg: number, endDeg: number, r: number): string {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Needle: from center outward
  const needleRad = ((angle - 90) * Math.PI) / 180;
  const nLen = R - 8;
  const nx = cx + nLen * Math.cos(needleRad);
  const ny = cy + nLen * Math.sin(needleRad);

  // Tick positions (SHORT, HOLD, LONG) at 180°, 90°, 0° of our convention
  const ticks = [
    { angleDeg: 180, label: "SHORT", anchor: "end"   },
    { angleDeg:  90, label: "HOLD",  anchor: "middle" },
    { angleDeg:   0, label: "LONG",  anchor: "start"  },
  ];

  return (
    <div className="flex flex-col items-center">
      <svg
        width="320"
        height="180"
        viewBox="0 0 320 180"
        aria-label={`Señal ${label} con confianza ${confPct}%`}
      >
        <defs>
          <filter id="glow-gauge">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Red zone — SHORT (180° → 150°) */}
        <path
          d={arcPath(180, 120, R)}
          fill="none"
          stroke="#EF4444"
          strokeWidth="18"
          strokeLinecap="butt"
          opacity="0.6"
        />
        {/* Amber zone — NEUTRAL (120° → 60°) */}
        <path
          d={arcPath(120, 60, R)}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="18"
          strokeLinecap="butt"
          opacity="0.6"
        />
        {/* Green zone — LONG (60° → 0°) */}
        <path
          d={arcPath(60, 0, R)}
          fill="none"
          stroke="#22C55E"
          strokeWidth="18"
          strokeLinecap="butt"
          opacity="0.6"
        />

        {/* Active arc overlay (solid, from 180° to current angle) */}
        {mounted && angle !== 90 && (
          <path
            d={arcPath(180, angle, R)}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow-gauge)"
            style={{ transition: "d 0.8s ease" }}
          />
        )}

        {/* Tick marks */}
        {ticks.map(({ angleDeg, label: tickLabel, anchor }) => {
          const rad = ((angleDeg - 90) * Math.PI) / 180;
          const tx = cx + (R + 18) * Math.cos(rad);
          const ty = cy + (R + 18) * Math.sin(rad);
          const ix = cx + (R - 14) * Math.cos(rad);
          const iy = cy + (R - 14) * Math.sin(rad);
          const ox = cx + (R + 4)  * Math.cos(rad);
          const oy = cy + (R + 4)  * Math.sin(rad);
          return (
            <g key={tickLabel}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <text
                x={tx}
                y={ty}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor={anchor as never}
                dominantBaseline="middle"
              >
                {tickLabel}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <g style={{ transition: mounted ? "transform 0.8s cubic-bezier(.4,0,.2,1)" : "none" }}>
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow-gauge)"
          />
          <circle cx={cx} cy={cy} r="6" fill={color} filter="url(#glow-gauge)" />
          <circle cx={cx} cy={cy} r="3" fill="rgba(255,255,255,0.9)" />
        </g>

        {/* Center verdict */}
        <text
          x={cx}
          y={cy + 34}
          textAnchor="middle"
          fill={color}
          fontSize="26"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          filter="url(#glow-gauge)"
          style={{ transition: "fill 0.5s" }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + 52}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
        >
          {confPct}% confianza
        </text>
      </svg>
    </div>
  );
}
