"use client";
import { useState } from "react";
import type { BaZiResponse } from "@/lib/bazi-types";
import FourPillarsDisplay from "./FourPillarsDisplay";
import ElementBalance from "./ElementBalance";
import DayMasterCard from "./DayMasterCard";
import TenGodsTable from "./TenGodsTable";
import LuckCyclesTimeline from "./LuckCyclesTimeline";
import YearForecast from "./YearForecast";
import OrganHealthMap from "./OrganHealthMap";
import RecommendationsPanel from "./RecommendationsPanel";
import SymbolicStars from "./SymbolicStars";
import AnimalRelationships from "./AnimalRelationships";

const TABS = [
  { id: "overview", label: "Visión General" },
  { id: "tengods", label: "Diez Dioses" },
  { id: "luck", label: "Ciclos de Suerte" },
  { id: "year", label: "Año Actual" },
  { id: "animals", label: "Animales" },
  { id: "stars", label: "Estrellas" },
  { id: "health", label: "Salud" },
  { id: "recs", label: "Recomendaciones" },
];

export default function BaZiPanel({ data }: { data: BaZiResponse }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-[#0A0E1A] text-white rounded-2xl border border-[#334155] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0A0E1A] px-6 py-5 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">☯</span>
          <div>
            <h2 className="text-[#C9A84C] text-xl font-bold">四柱推命 Cuatro Pilares del Destino</h2>
            <p className="text-slate-400 text-sm">
              Basado en el sistema de 5 Elementos y los ciclos celestiales/terrestres
            </p>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Hora civil: {data.solar_time.clock_time} →
          Hora solar: {data.solar_time.solar_time}
          {data.solar_time.solar_day_shift !== 0 && (
            <span className="ml-1 text-yellow-400">
              ({data.solar_time.solar_day_shift > 0 ? "día siguiente" : "día anterior"})
            </span>
          )}
          <span className="ml-2">({data.solar_time.total_correction_min > 0 ? "+" : ""}{data.solar_time.total_correction_min} min)</span>
        </div>
      </div>

      {/* Day Master highlight */}
      <div className="px-6 pt-5">
        <DayMasterCard data={data} />
      </div>

      {/* Four Pillars */}
      <div className="px-6 pt-5">
        <FourPillarsDisplay data={data} />
      </div>

      {/* Element Balance */}
      <div className="px-6 pt-5">
        <ElementBalance data={data} />
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6">
        <div className="flex flex-wrap gap-2 border-b border-[#334155] pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTab === tab.id
                  ? "bg-[#C9A84C] text-[#0A0E1A] font-semibold"
                  : "text-slate-400 hover:text-slate-200 bg-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <AnimalRelationships data={data} />
            </div>
          )}
          {activeTab === "tengods" && <TenGodsTable data={data} />}
          {activeTab === "luck" && <LuckCyclesTimeline data={data} />}
          {activeTab === "year" && <YearForecast data={data} />}
          {activeTab === "animals" && <AnimalRelationships data={data} />}
          {activeTab === "stars" && <SymbolicStars data={data} />}
          {activeTab === "health" && <OrganHealthMap data={data} />}
          {activeTab === "recs" && <RecommendationsPanel data={data} />}
        </div>
      </div>
    </div>
  );
}
