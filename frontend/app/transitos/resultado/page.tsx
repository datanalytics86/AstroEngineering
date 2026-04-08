"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TransitResponse, ChartResponse } from "@/lib/types";
import TransitTimeline from "@/components/TransitTimeline";
import ForecastDashboard from "@/components/ForecastDashboard";
import InterpretationCard from "@/components/InterpretationCard";

export default function TransitosPage() {
  const router = useRouter();
  const [transits, setTransits] = useState<TransitResponse | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"forecast" | "timeline" | "list">("forecast");

  useEffect(() => {
    const tStr = sessionStorage.getItem("astro_transits");
    const cStr = sessionStorage.getItem("astro_chart");
    if (!tStr || !cStr) {
      router.push("/");
      return;
    }
    setTransits(JSON.parse(tStr));
    setChart(JSON.parse(cStr));
  }, [router]);

  if (!transits || !chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gold font-mono animate-pulse">Cargando tránsitos…</span>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const endDate = nextYear.toISOString().slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-gold">Tránsitos Planetarios</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">
            {chart.name} · {today} → {endDate}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/carta/resultado")}
            className="border border-space-border text-gray-400 px-4 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors font-mono"
          >
            ← Carta Natal
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-space-card border border-space-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono text-gold mb-1">{transits.current_transits.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Tránsitos</div>
        </div>
        <div className="bg-space-card border border-space-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono text-gold mb-1">
            {transits.current_transits.filter((t) => t.importance === "crítica" || t.importance === "alta").length}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Alta importancia</div>
        </div>
        <div className="bg-space-card border border-space-border rounded-xl p-4 text-center">
          <div className="text-2xl font-mono text-gold mb-1">
            {transits.exact_aspects_calendar.length}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Aspectos exactos</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-space-card border border-space-border rounded-lg p-1 w-fit">
        {(["forecast", "timeline", "list"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-mono transition-colors ${
              activeTab === tab
                ? "bg-gold text-space-bg font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab === "forecast" ? "Pronóstico" : tab === "timeline" ? "Timeline" : "Lista"}
          </button>
        ))}
      </div>

      {/* Contenido de cada tab */}
      {activeTab === "forecast" && (
        <ForecastDashboard timeline={transits.timeline} />
      )}

      {activeTab === "timeline" && (
        <TransitTimeline
          transits={transits.current_transits}
          startDate={today}
          endDate={endDate}
        />
      )}

      {activeTab === "list" && (
        <div className="space-y-4">
          {transits.current_transits
            .filter((t) => t.importance !== "baja")
            .sort((a, b) => b.score - a.score)
            .map((t, i) => (
              <InterpretationCard key={i} transit={t} />
            ))}
        </div>
      )}
    </div>
  );
}
