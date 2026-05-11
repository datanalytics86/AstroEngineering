"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const GOD_COLORS: Record<string, string> = {
  friend: "#94A3B8", rob: "#FB923C", eating: "#A78BFA",
  hurting: "#F472B6", d_wealth: "#4ADE80", i_wealth: "#86EFAC",
  d_officer: "#60A5FA", "7_killings": "#F87171", d_resource: "#FCD34D", i_resource: "#FDE68A",
};

export default function TenGodsTable({ data }: { data: BaZiResponse }) {
  const main = data.ten_gods.filter(g => !g.pillar.includes("hidden"));

  return (
    <div className="space-y-3">
      {main.map((g, i) => {
        const color = GOD_COLORS[g.god_key] ?? "#94A3B8";
        const hidden = data.ten_gods.filter(hg => hg.pillar === `${g.pillar}_hidden`);
        return (
          <div key={i} className="rounded-xl border border-[#334155] bg-[#151E2E] p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-bold text-[#C9A84C]">{g.stem_chinese}</span>
              <span className="text-slate-300 text-sm">{g.stem_pinyin}</span>
              <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: color + "22", color }}>
                {g.god_cn} {g.god_name}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{g.god_desc}</p>
            {hidden.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#1E293B]">
                <span className="text-xs text-slate-500 block mb-1">Troncos ocultos:</span>
                <div className="flex flex-wrap gap-2">
                  {hidden.map((h, j) => {
                    const hc = GOD_COLORS[h.god_key] ?? "#94A3B8";
                    return (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: hc + "22", color: hc }}>
                        {h.stem_chinese} ({h.god_name}) ×{h.weight?.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
