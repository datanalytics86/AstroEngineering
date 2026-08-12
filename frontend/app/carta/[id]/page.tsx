"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData, ClickTarget } from "@/lib/types";
import {
  loadChart,
  saveYearTransits,
  saveSolarReturn,
  isProUnlocked,
  unlockPro,
  loadYearTransits,
} from "@/lib/storage";
import { postWithWakingRetry } from "@/lib/api-fetch";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import InterpretationModal from "@/components/InterpretationModal";
import ChartSummaryModal from "@/components/ChartSummary";
import TopicSummarySection from "@/components/TopicSummarySection";
import DownloadPreviewPdfButton from "@/components/DownloadPreviewPdfButton";
import { generateChartSummary } from "@/lib/chart-summary";
import { generateHumanProSummary } from "@/lib/pro-human";
import { generateTierMinus1Content } from "@/lib/tier-minus1";
import {
  getTier1Aspects,
  buildPersonalIntensitySeries,
} from "@/lib/personal-intensity";
import ActionButton from "@/components/ActionButton";
import { useT } from "@/lib/i18n";
import { trackEvent } from "@/lib/observability";

export default function CartaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t, lang } = useT();
  const locale = lang === "en" ? "en" : "es";

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
  const [loadingTransits, setLoadingTransits] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [loadingSR, setLoadingSR] = useState(false);
  const [srError, setSrError] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ClickTarget | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [yearTick, setYearTick] = useState(0);

  useEffect(() => {
    if (!id) {
      router.push("/nueva");
      return;
    }
    const data = loadChart(id);
    if (!data) {
      router.push("/nueva");
      return;
    }
    setChart(data.chart);
    setBirthData(data.birthData);
    setProUnlocked(isProUnlocked(id));
  }, [id, router]);

  const preview = useMemo(
    () =>
      chart
        ? generateTierMinus1Content(chart, chart.name, locale, birthData?.city)
        : null,
    [chart, locale, birthData]
  );
  const tier1Aspects = useMemo(
    () => (chart ? getTier1Aspects(chart.aspects) : []),
    [chart]
  );
  const intensityData = useMemo(() => {
    if (!id) return [];
    const year = new Date().getFullYear();
    return buildPersonalIntensitySeries(loadYearTransits(id, year), year, locale);
  }, [id, locale, proUnlocked, yearTick]);

  function handleUnlockPro() {
    if (!id) return;
    // TODO(Stripe): replace unlockPro with real checkout session
    unlockPro(id, false);
    setProUnlocked(true);
    trackEvent("pro.unlocked");
    try {
      window.dispatchEvent(
        new CustomEvent("astro-pro-unlocked", { detail: { chartId: id } })
      );
    } catch {
      /* ignore */
    }
    requestAnimationFrame(() => {
      document
        .getElementById("pro-unlock-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function scrollToTopics() {
    document
      .getElementById("topic-summaries-heading")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOpenSummary() {
    if (id && isProUnlocked(id)) {
      setProUnlocked(true);
      setShowSummary(true);
      trackEvent("summary.opened");
      return;
    }
    document
      .getElementById("astro-pro-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCalcTransits() {
    if (!chart || !birthData) return;
    setLoadingTransits(true);
    setTransitError(null);

    const year = new Date().getFullYear();
    const req = {
      natal_planets: chart.planets,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
    };

    try {
      const res = await postWithWakingRetry("/api/transits", req, () =>
        setTransitError(t("common.error.waking"))
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al calcular tránsitos" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setTransitError(null);
      const data = await res.json();
      saveYearTransits(id, year, data);
      setYearTick((n) => n + 1);
      trackEvent("year.calculated", { stay: false });
      router.push(`/transitos/${id}`);
    } catch (e) {
      setTransitError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTransits(false);
    }
  }

  async function handleCalcYear() {
    if (!chart || !birthData || !id) return;
    setLoadingTransits(true);
    setTransitError(null);
    const year = new Date().getFullYear();
    try {
      const res = await postWithWakingRetry(
        "/api/transits",
        {
          natal_planets: chart.planets,
          start_date: `${year}-01-01`,
          end_date: `${year}-12-31`,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
        },
        () => setTransitError(t("common.error.waking"))
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setTransitError(null);
      saveYearTransits(id, year, await res.json());
      setYearTick((n) => n + 1);
      trackEvent("year.calculated", { stay: true });
    } catch (e) {
      setTransitError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTransits(false);
    }
  }

  async function handleSolarReturn() {
    if (!chart || !birthData) return;
    setLoadingSR(true);
    setSrError(null);
    const sunPlanet = chart.planets.find((p) => p.name === "Sol");
    if (!sunPlanet) {
      setLoadingSR(false);
      return;
    }
    try {
      const year = new Date().getFullYear();
      const res = await postWithWakingRetry(
        "/api/solar-return",
        {
          natal_sun_longitude: sunPlanet.longitude,
          year,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone_offset: birthData.timezone_offset,
          name: `Retorno Solar ${year} — ${chart.name}`,
        },
        () => setSrError(t("common.error.waking"))
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setSrError(null);
      const srChart = await res.json();
      saveSolarReturn(id, srChart);
      router.push(`/retorno/${id}`);
    } catch (e) {
      setSrError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingSR(false);
    }
  }

  if (!chart || !preview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">{t("chart.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 mb-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">{chart.name}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {[chart.birth_date, chart.birth_time, birthData?.city].filter(Boolean).join(" · ")}
          </p>
          <p className="text-[11px] sm:text-xs font-mono text-slate-400 mt-2">
            {t("chart.trust_strip")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            variant="primary"
            accent="blue"
            onClick={scrollToTopics}
            className="min-h-[44px]"
          >
            {t("chart.nav.topics")}
          </ActionButton>
          {preview && (
            <DownloadPreviewPdfButton content={preview} variant="secondary" />
          )}
          <ActionButton
            variant="secondary"
            accent="indigo"
            onClick={handleOpenSummary}
            className="min-h-[44px]"
          >
            {proUnlocked ? t("chart.nav.summary") : t("chart.pro.summary_locked")}
          </ActionButton>
          <ActionButton
            variant="secondary"
            accent="blue"
            onClick={handleCalcTransits}
            disabled={loadingTransits}
            className="min-h-[44px]"
          >
            {loadingTransits ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                {t("chart.nav.transits_loading")}
              </>
            ) : (
              t("chart.nav.transits")
            )}
          </ActionButton>
        </div>
        <button
          type="button"
          onClick={handleSolarReturn}
          disabled={loadingSR}
          className="self-start text-sm text-slate-400 hover:text-amber-700 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {loadingSR
            ? t("chart.nav.transits_loading")
            : t("chart.nav.solar_link").replace("{year}", String(new Date().getFullYear()))}
        </button>
      </div>

      {transitError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 font-mono">
          {t("chart.error.transit")}: {transitError}
        </div>
      )}

      {srError && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 font-mono">
          {t("chart.error.solar")}: {srError}
        </div>
      )}

      {loadingTransits && (
        <div className="mb-5 bg-white border border-border rounded-xl p-5 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-mono mb-1">{t("chart.nav.transits_loading")}</p>
          <p className="text-slate-400 text-xs">{t("chart.loading_hint")}</p>
        </div>
      )}

      {/* 3. Hero wheel — always visible, free */}
      <section className="mb-10" aria-labelledby="chart-hero-heading">
        <div className="text-center mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-blue-600 mb-1.5">
            {t("chart.hero.badge")}
          </p>
          <h2
            id="chart-hero-heading"
            className="font-semibold text-xl sm:text-2xl text-slate-900 tracking-tight"
          >
            {t("chart.wheel.title")}
          </h2>
        </div>

        <div
          className="relative mx-auto max-w-[680px] rounded-[28px] border border-indigo-100/80 p-1.5 sm:p-5 shadow-card-md"
          style={{
            background:
              "radial-gradient(circle at 50% 38%, #FFFFFF 0%, #F8FAFC 52%, #EEF2FF 100%)",
          }}
        >
          <ChartWheel
            size="hero"
            planets={chart.planets}
            houses={chart.houses}
            ascendant={chart.ascendant}
            midheaven={chart.midheaven}
            aspects={chart.aspects}
            highlightedPlanet={highlighted}
            onPlanetClick={(name) =>
              setHighlighted((prev) => (prev === name ? undefined : name))
            }
            onElementClick={(target) => setModalTarget(target)}
          />
        </div>

        {highlighted ? (
          <p className="text-xs text-center text-blue-600 mt-3">
            {highlighted} — {t("chart.wheel.deselect")}
          </p>
        ) : (
          <p className="text-xs text-slate-400 text-center mt-3">{t("chart.wheel.hint")}</p>
        )}

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-4">
          <div className="bg-white border border-border rounded-xl px-4 py-3 shadow-card">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-0.5">
              {t("chart.ascendant")}
            </div>
            <div className="text-blue-600 font-semibold text-base leading-tight">
              {chart.ascendant.sign}
            </div>
            <div className="text-slate-500 font-mono text-xs mt-0.5">
              {chart.ascendant.degree_display}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl px-4 py-3 shadow-card">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-0.5">
              {t("chart.mc")}
            </div>
            <div className="text-teal-600 font-semibold text-base leading-tight">
              {chart.midheaven.sign}
            </div>
            <div className="text-slate-500 font-mono text-xs mt-0.5">
              {chart.midheaven.degree_display}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Topics free + Pro */}
      <div id="astro-pro-section" className="mb-10">
        <TopicSummarySection
          preview={preview}
          isPro={proUnlocked}
          onUnlock={handleUnlockPro}
          tier1Aspects={tier1Aspects}
          intensityData={intensityData}
          onOpenTechnicalSummary={() => {
            setProUnlocked(true);
            setShowSummary(true);
            trackEvent("summary.opened");
          }}
          onCalcYear={handleCalcYear}
          yearLoading={loadingTransits}
          yearError={transitError}
          chart={chart}
          chartId={id}
        />
      </div>

      {/* 5. Positions + aspects — secondary, collapsed */}
      <section className="border-t border-slate-200 pt-8" aria-labelledby="tech-chart-heading">
        <button
          type="button"
          onClick={() => setTechOpen((v) => !v)}
          className="w-full flex items-start sm:items-center justify-between gap-3 text-left mb-5 min-h-[44px] group"
          aria-expanded={techOpen}
        >
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">
              {t("chart.tech.badge")}
            </p>
            <h2
              id="tech-chart-heading"
              className="font-semibold text-lg sm:text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors"
            >
              {t("chart.tech.title")}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">{t("chart.tech.subtitle")}</p>
          </div>
          <span className="shrink-0 text-slate-400 font-mono text-sm mt-1" aria-hidden>
            {techOpen ? "▴" : "▾"}
          </span>
        </button>

        {techOpen && (
          <div className="max-w-3xl space-y-6">
            <PlanetPositions
              planets={chart.planets}
              highlightedPlanet={highlighted}
              onPlanetClick={(name) =>
                setHighlighted((prev) => (prev === name ? undefined : name))
              }
            />
            <AspectTable aspects={chart.aspects} highlightedPlanet={highlighted} />
          </div>
        )}
      </section>

      <InterpretationModal
        target={modalTarget}
        allAspects={chart.aspects}
        onClose={() => setModalTarget(null)}
      />

      {showSummary && proUnlocked && (
        <ChartSummaryModal
          summary={generateChartSummary(chart)}
          human={generateHumanProSummary(chart, locale)}
          name={chart.name}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
