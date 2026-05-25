"use client";

interface CosmicWeatherStripProps {
  cautionFlags: string[];
  volatility: "alta" | "media" | "baja";
}

const VOLATILITY_CONFIG = {
  alta:  { label: "Volatilidad ALTA",  color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
  media: { label: "Volatilidad MEDIA", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  baja:  { label: "Volatilidad BAJA",  color: "#22C55E", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)"  },
};

export default function CosmicWeatherStrip({ cautionFlags, volatility }: CosmicWeatherStripProps) {
  const vol = VOLATILITY_CONFIG[volatility];

  if (cautionFlags.length === 0 && volatility === "baja") return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Volatility badge */}
      <span
        className="text-xs font-mono px-3 py-1.5 rounded-full border font-semibold tracking-wide uppercase"
        style={{ color: vol.color, backgroundColor: vol.bg, borderColor: vol.border }}
      >
        ⚡ {vol.label}
      </span>

      {/* Caution flags */}
      {cautionFlags.map((flag) => (
        <span
          key={flag}
          className="text-xs font-mono px-3 py-1.5 rounded-full border"
          style={{
            color: "#F59E0B",
            backgroundColor: "rgba(245,158,11,0.08)",
            borderColor: "rgba(245,158,11,0.25)",
          }}
        >
          {flag}
        </span>
      ))}
    </div>
  );
}
