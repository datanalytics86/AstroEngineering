"use client";
import type { BaZiResponse, AnimalRelationship } from "@/lib/bazi-types";

const TYPE_COLORS: Record<string, string> = {
  "Six Harmony (六合)": "#4ADE80",
  "Six Clash (六冲)": "#F87171",
  "Harm (六害)": "#FB923C",
  "Self Punishment (自刑)": "#A78BFA",
  "Three Punishment (三刑)": "#F472B6",
};

function RelGroup({ title, items }: { title: string; items: AnimalRelationship[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">{title}</h4>
      <div className="space-y-2">
        {items.map((rel, i) => {
          const color = TYPE_COLORS[rel.type] ?? "#94A3B8";
          return (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-[#0A0E1A] px-3 py-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: color + "22", color }}>
                {rel.type}
              </span>
              <span className="text-slate-300 text-sm">{rel.animals.join(" · ")}</span>
              {rel.result_element && (
                <span className="ml-auto text-xs text-slate-400">→ {rel.result_element}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnimalRelationships({ data }: { data: BaZiResponse }) {
  const r = data.animal_relationships;
  const total = r.combinations.length + r.clashes.length + r.punishments.length + r.harms.length;

  if (total === 0) {
    return <p className="text-slate-400 text-sm">No se detectaron relaciones especiales entre los animales del destino.</p>;
  }

  return (
    <div className="space-y-4">
      <RelGroup title="Armonías (六合)" items={r.combinations} />
      <RelGroup title="Choques (六冲)" items={r.clashes} />
      <RelGroup title="Daños (六害)" items={r.harms} />
      <RelGroup title="Castigos" items={r.punishments} />
    </div>
  );
}
