"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData } from "@/lib/types";
import { loadSolarReturn, loadChart } from "@/lib/storage";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import SolarReturnSummaryPanel from "@/components/SolarReturnSummaryPanel";
import { generateSolarReturnSummary } from "@/lib/solar-return-summary";
import { useT } from "@/lib/i18n";

export default function RetornoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t } = useT();

  const [srChart, setSrChart]   = useState<ChartResponse | null>(null);
  const [natal, setNatal]       = useState<ChartResponse | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!id) { router.push("/"); return; }
    const sr = loadSolarReturn(id);
    const n  = loadChart(id);
    if (!sr || !n) { router.push(`/carta/${id}`); return; }
    setSrChart(sr);
    setNatal(n.chart);
  }, [id, router]);

  const summary = useMemo(
    () => (srChart ? generateSolarReturnSummary(srChart) : null),
    [srChart],
  );

  if (!srChart || !natal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">{t("solar.loading")}</p>
        </div>
      </div>
    );
  }

  const year = (srChart as any).sr_year ?? new Date().getFullYear();
  const localTime = (srChart as any).sr_local_time ?? srChart.birth_time;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">☉</span>
            <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">
              {t("solar.title")} {year}
            </h1>
          </div>
          <p className="text-slate-400 font-mono text-sm mt-1">
            {natal.name} · {t("solar.subtitle_year")} {year} ·{" "}
            <span className="text-amber-600 font-semibold">{srChart.ascendant.sign}</span> ASC ·{" "}
            {t("solar.subtitle_time")} {localTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/")}
            className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-300 hover:text-blue-600 transition-colors font-mono"
          >
            {t("solar.nav.home")}
          </button>
          <button
            onClick={() => router.push(`/carta/${id}`)}
            className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-amber-400 hover:text-amber-600 transition-colors font-mono"
          >
            {t("solar.nav.natal")}
          </button>
          <button
            onClick={() => router.push(`/transitos/${id}`)}
            className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors font-mono"
          >
            {t("solar.nav.transits")}
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800 font-mono">
        {t("solar.explanation")}
      </div>

      {/* Layout: main content + sticky summary */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 xl:items-start">

        {/* Left column */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-slate-700">{t("solar.wheel.title")}</h2>
            <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
              <ChartWheel
                planets={srChart.planets}
                houses={srChart.houses}
                ascendant={srChart.ascendant}
                midheaven={srChart.midheaven}
                aspects={srChart.aspects}
                highlightedPlanet={highlighted}
                onPlanetClick={(name) => setHighlighted((p) => (p === name ? undefined : name))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-4 shadow-card">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">{t("solar.asc")}</div>
              <div className="text-amber-600 font-mono text-lg font-semibold">{srChart.ascendant.sign}</div>
              <div className="text-slate-500 font-mono text-sm">{srChart.ascendant.degree_display}</div>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-card">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">{t("solar.mc")}</div>
              <div className="text-amber-500 font-mono text-lg font-semibold">{srChart.midheaven.sign}</div>
              <div className="text-slate-500 font-mono text-sm">{srChart.midheaven.degree_display}</div>
            </div>
          </div>

          <PlanetPositions
            planets={srChart.planets}
            highlightedPlanet={highlighted}
            onPlanetClick={(name) => setHighlighted((p) => (p === name ? undefined : name))}
          />
          <AspectTable aspects={srChart.aspects} highlightedPlanet={highlighted} />
        </div>

        {/* Right column — sticky summary */}
        {summary && (
          <div className="hidden xl:block xl:sticky xl:top-6">
            <SolarReturnSummaryPanel
              summary={summary}
              name={natal.name}
              year={year}
              ascSign={srChart.ascendant.sign}
            />
          </div>
        )}
      </div>
    </div>
  );
}
