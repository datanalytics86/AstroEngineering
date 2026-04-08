"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { TransitResponse, ChartResponse } from "@/lib/types";
import { loadTransits, loadChart } from "@/lib/storage";
import TransitTimeline from "@/components/TransitTimeline";
import ForecastDashboard from "@/components/ForecastDashboard";
import InterpretationCard from "@/components/InterpretationCard";

export default function TransitosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transits, setTransits] = useState<TransitResponse | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"forecast" | "timeline" | "list">("forecast");

  useEffect(() => {
    if (!id) { router.push("/"); return; }
    const t = loadTransits(id);
    const c = loadChart(id);
    if (!t || !c) { router.push("/"); return; }
    setTransits(t);
    setChart(c.chart);
  }, [id, router]);

  if (!transits || !chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gold text-3xl mb-3 animate-pulse">🪐</div>
          <p className="text-gray-500 font-mono text-sm">Cargando tránsitos…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const endDate = nextYear.toISOString().slice(0, 10);

  const criticalAndHigh = transits.current_transits.filter(
    (t) => t.importance === "crítica" || t.importance === "alta"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-gold">Tránsitos Planetarios</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">
            {chart.name} · {today} → {endDate}
          </p>
        </div>
        <button
          onClick={() => router.push(`/carta/${id}`)}
          className="border border-space-border text-gray-400 px-4 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors font-mono"
        >
          ← Carta Natal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tránsitos totales", value: transits.current_transits.length },
          { label: "Alta importancia",  value: criticalAndHigh.length },
          { label: "Aspectos exactos",  value: transits.exact_aspects_calendar.length },
          { label: "Meses analizados",  value: transits.timeline.length },
        ].map((s) => (
          <div key={s.label} className="bg-space-card border border-space-border rounded-xl p-4 text-center">
            <div className="text-2xl font-mono text-gold mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
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
            {tab === "forecast" ? "Pronóstico" : tab === "timeline" ? "Timeline" : "Lista detallada"}
          </button>
        ))}
      </div>

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
          {transits.current_transits.filter((t) => t.importance !== "baja").length === 0 && (
            <p className="text-gray-500 font-mono text-center py-8">
              No se encontraron tránsitos significativos en este período.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
