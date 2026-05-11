"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_CONFIG: Record<string, { color: string; emoji: string }> = {
  wood:  { color: "#4CAF50", emoji: "🌿" },
  fire:  { color: "#EF4444", emoji: "❤️" },
  earth: { color: "#EAB308", emoji: "⛰️" },
  metal: { color: "#9CA3AF", emoji: "🫁" },
  water: { color: "#3B82F6", emoji: "💧" },
};

export default function OrganHealthMap({ data }: { data: BaZiResponse }) {
  const elements = ["wood","fire","earth","metal","water"] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {elements.map((el) => {
        const info = data.organ_health[el];
        if (!info) return null;
        const cfg = ELEMENT_CONFIG[el];
        const weak = info.status === "absent" || info.status === "weak";
        return (
          <div key={el} className={`rounded-xl border p-4 ${weak ? "border-red-500/30 bg-red-950/20" : "border-[#334155] bg-[#151E2E]"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{cfg.emoji}</span>
              <span className="font-semibold text-sm" style={{ color: cfg.color }}>{el.charAt(0).toUpperCase() + el.slice(1)}</span>
              {weak && <span className="text-xs text-red-400 ml-auto">Atención</span>}
            </div>
            <div className="text-slate-300 text-xs mb-1">{info.organs}</div>
            <div className="text-slate-400 text-xs mb-2">Emoción: {info.emotion}</div>
            <div className="text-xs text-[#2DD4BF]">Sonido: <span className="font-mono">{info.healing_sound}</span></div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(info.foods ?? []).map((f: string) => (
                <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-[#0A0E1A] text-slate-400">{f}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
