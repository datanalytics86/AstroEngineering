"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  wood:  { color: "#4CAF50", label: "Madera", emoji: "🌿" },
  fire:  { color: "#EF4444", label: "Fuego",  emoji: "🔥" },
  earth: { color: "#EAB308", label: "Tierra", emoji: "⛰️" },
  metal: { color: "#9CA3AF", label: "Metal",  emoji: "⚔️" },
  water: { color: "#3B82F6", label: "Agua",   emoji: "🌊" },
};

const STATUS_LABELS: Record<string, string> = {
  absent: "AUSENTE", weak: "DÉBIL", moderate: "MODERADO",
  balanced: "EQUILIBRADO", strong: "FUERTE", dominant: "DOMINANTE",
};

export default function ElementBalance({ data }: { data: BaZiResponse }) {
  const elements = ["wood","fire","earth","metal","water"] as const;

  return (
    <div className="rounded-xl border border-[#334155] bg-[#151E2E] p-5">
      <h3 className="text-[#C9A84C] font-semibold mb-4">Balance de 5 Elementos</h3>
      <div className="space-y-3">
        {elements.map((el) => {
          const info = data.element_balance[el];
          const cfg = ELEMENT_CONFIG[el];
          return (
            <div key={el} className="flex items-center gap-3">
              <span className="w-6 text-center">{cfg.emoji}</span>
              <span className="w-16 text-sm text-slate-300">{cfg.label}</span>
              <div className="flex-1 h-4 bg-[#1E293B] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${info.percentage}%`, background: cfg.color }}
                />
              </div>
              <span className="w-12 text-right text-sm font-mono" style={{ color: cfg.color }}>
                {info.percentage.toFixed(1)}%
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full w-24 text-center ${
                info.status === "absent" ? "bg-red-900/40 text-red-300" :
                info.status === "dominant" ? "bg-yellow-900/40 text-yellow-300" :
                "bg-slate-700/40 text-slate-300"
              }`}>
                {STATUS_LABELS[info.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
