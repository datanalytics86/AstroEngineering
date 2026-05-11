"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_COLORS: Record<string, string> = {
  Wood: "#4CAF50", Fire: "#EF4444", Earth: "#EAB308",
  Metal: "#9CA3AF", Water: "#3B82F6",
};

export default function LuckCyclesTimeline({ data }: { data: BaZiResponse }) {
  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">
        Cada ciclo dura 10 años. El primer ciclo comienza a los {data.luck_cycles[0]?.age_start ?? "?"} años.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.luck_cycles.map((cycle) => {
          const elBase = cycle.stem.element.replace("Yang ","").replace("Yin ","");
          const color = ELEMENT_COLORS[elBase] ?? "#C9A84C";
          return (
            <div key={cycle.cycle_number}
              className="rounded-xl border border-[#334155] bg-[#151E2E] p-3 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500">Edad {cycle.age_start}–{cycle.age_end}</span>
              <span className="text-2xl font-bold" style={{ color }}>{cycle.pillar_display}</span>
              <span className="text-xs text-slate-400">{cycle.stem.pinyin} · {cycle.branch.pinyin}</span>
              <span className="text-xl">{cycle.branch.emoji}</span>
              <span className="text-xs text-slate-400">{cycle.branch.animal_es}</span>
              <span className="text-xs px-2 py-0.5 rounded-full mt-1"
                style={{ background: color + "22", color }}>{cycle.stem.element}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
