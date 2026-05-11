"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_COLORS: Record<string, string> = {
  Wood: "#4CAF50", Fire: "#EF4444", Earth: "#EAB308",
  Metal: "#9CA3AF", Water: "#3B82F6",
};

const PILLAR_LABELS: Record<string, string> = {
  hour: "Hora", day: "Día", month: "Mes", year: "Año",
};
const PILLAR_DOMAINS: Record<string, string> = {
  hour: "Futuro", day: "Ser", month: "Carrera", year: "Origen",
};

export default function FourPillarsDisplay({ data }: { data: BaZiResponse }) {
  const order = ["hour", "day", "month", "year"] as const;

  return (
    <div className="grid grid-cols-4 gap-3">
      {order.map((key) => {
        const pillar = data.four_pillars[key];
        const stemColor = ELEMENT_COLORS[pillar.stem.element_base] ?? "#C9A84C";
        const isDay = key === "day";
        return (
          <div
            key={key}
            className={`rounded-xl border flex flex-col items-center py-5 px-3 gap-1 ${
              isDay ? "border-[#C9A84C] bg-[#1E293B]" : "border-[#334155] bg-[#151E2E]"
            }`}
          >
            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              {PILLAR_LABELS[key]}
            </span>

            {/* Stem */}
            <span className="text-[2.2rem] font-bold leading-none" style={{ color: stemColor }}>
              {pillar.stem.chinese}{isDay && <span className="text-[#C9A84C] text-lg ml-1">★</span>}
            </span>
            <span className="text-sm text-slate-300">{pillar.stem.pinyin}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: stemColor + "22", color: stemColor }}>
              {pillar.stem.element}
            </span>

            <div className="w-full border-t border-[#334155] my-2" />

            {/* Branch */}
            <span className="text-[1.8rem] leading-none">{pillar.branch.emoji}</span>
            <span className="text-[1.4rem] font-bold text-slate-200">{pillar.branch.chinese}</span>
            <span className="text-sm text-slate-300">{pillar.branch.pinyin}</span>
            <span className="text-xs text-slate-400">{pillar.branch.animal_es}</span>

            <div className="w-full border-t border-[#334155] mt-2 pt-2">
              <span className="text-xs text-[#2DD4BF] text-center block">{PILLAR_DOMAINS[key]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
