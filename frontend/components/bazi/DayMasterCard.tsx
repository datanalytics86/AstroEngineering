"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_COLORS: Record<string, string> = {
  Wood: "#4CAF50", Fire: "#EF4444", Earth: "#EAB308",
  Metal: "#9CA3AF", Water: "#3B82F6",
};

export default function DayMasterCard({ data }: { data: BaZiResponse }) {
  const dm = data.day_master;
  const elBase = dm.element.replace("Yang ", "").replace("Yin ", "");
  const color = ELEMENT_COLORS[elBase] ?? "#C9A84C";

  return (
    <div className="rounded-xl border border-[#C9A84C]/40 bg-[#1E293B] p-5">
      <div className="flex items-start gap-4">
        <div className="text-6xl font-bold" style={{ color }}>{dm.chinese}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#C9A84C] font-semibold text-lg">{dm.pinyin}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: color + "22", color }}>
              {dm.element}
            </span>
          </div>
          <div className="text-slate-300 text-sm mt-1 italic">{dm.title}</div>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">{dm.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-[#0A0E1A] rounded-lg p-3">
          <div className="text-[#2DD4BF] text-xs font-semibold mb-2">FORTALEZAS</div>
          <ul className="space-y-1">
            {dm.strengths.map((s) => (
              <li key={s} className="text-slate-300 text-xs flex gap-1">
                <span className="text-[#2DD4BF]">+</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#0A0E1A] rounded-lg p-3">
          <div className="text-red-400 text-xs font-semibold mb-2">DESAFÍOS</div>
          <ul className="space-y-1">
            {dm.vulnerabilities.map((v) => (
              <li key={v} className="text-slate-300 text-xs flex gap-1">
                <span className="text-red-400">−</span>{v}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
