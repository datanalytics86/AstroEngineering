"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData } from "@/lib/types";
import {
  loadChart,
  saveYearTransits,
  saveSolarReturn,
  isProUnlocked,
  unlockPro,
  loadYearTransits,
  loadSolarReturn,
} from "@/lib/storage";
import { postWithWakingRetry } from "@/lib/api-fetch";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import TopicSummarySection from "@/components/TopicSummarySection";
import DownloadPreviewPdfButton from "@/components/DownloadPreviewPdfButton";
import { generateHumanProSummary } from "@/lib/pro-human";
import { generateTierMinus1Content } from "@/lib/tier-minus1";
import { buildYearMap } from "@/lib/year-map";
import {
  getTier1Aspects,
  buildPersonalIntensitySeries,
} from "@/lib/personal-intensity";
import ActionButton from "@/components/ActionButton";
import { useT } from "@/lib/i18n";
import { trackLearning } from "@/lib/learning";
import { shareChartUrl } from "@/lib/share";

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
  const [proUnlocked, setProUnlocked] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [solarTick, setSolarTick] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [yearTick, setYearTick] = useState(0);
  const [checkoutBanner, setCheckoutBanner] = useState<"success" | "cancel" | "error" | null>(
    null,
  );

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

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");
    if (!checkout) return;

    if (checkout === "cancel") {
      trackLearning("checkout_cancel");
      setCheckoutBanner("cancel");
      window.history.replaceState({}, "", `/carta/${id}#pro-unlock-panel`);
      return;
    }

    if (checkout === "success" && sessionId) {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(
            `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}&chart_id=${encodeURIComponent(id)}`,
          );
          const data = (await res.json()) as { paid?: boolean; chartId?: string | null };
          if (cancelled) return;
          if (res.ok && data.paid && data.chartId === id) {
            unlockPro(id, { permanent: true, sessionId, source: "stripe" });
            setProUnlocked(true);
            trackLearning("checkout_success");
            trackLearning("pro_unlocked");
            setCheckoutBanner("success");
          } else {
            setCheckoutBanner("error");
          }
        } catch {
          if (!cancelled) setCheckoutBanner("error");
        } finally {
          if (!cancelled) {
            window.history.replaceState({}, "", `/carta/${id}`);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [id]);

  useEffect(() => {
    if (!chart || typeof window === "undefined") return;
    if (window.location.hash !== "#pro-unlock-panel") return;
    const t = window.setTimeout(() => {
      document.getElementById("pro-unlock-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [chart]);

  const preview = useMemo(
    () =>
      chart
        ? generateTierMinus1Content(chart, chart.name, locale, birthData?.city, id)
        : null,
    [chart, locale, birthData, id]
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
  const human = useMemo(
    () => (chart ? generateHumanProSummary(chart, locale) : null),
    [chart, locale],
  );
  const yearMap = useMemo(() => {
    if (!chart || !id) return null;
    const year = new Date().getFullYear();
    return buildYearMap({
      chart,
      transits: loadYearTransits(id, year),
      solar: loadSolarReturn(id),
      year,
      lang: locale,
    });
  }, [chart, id, locale, yearTick, solarTick, proUnlocked]);

  function handleUnlockPro() {
    if (!id) return;
    unlockPro(id, false);
    setProUnlocked(true);
    trackLearning("pro_unlocked");
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
      trackLearning("year_calculated", { stay: true });
    } catch (e) {
      setTransitError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTransits(false);
    }
  }

  async function handleEnsureSolar() {
    if (!chart || !birthData || !id) return;
    if (loadSolarReturn(id)) return;
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
          name: `${chart.name} ${year}`,
        },
        () => setSrError(t("common.error.waking"))
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setSrError(null);
      saveSolarReturn(id, await res.json());
      setSolarTick((n) => n + 1);
    } catch (e) {
      setSrError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingSR(false);
    }
  }

  useEffect(() => {
    if (!proUnlocked || !id) return;
    const year = new Date().getFullYear();
    if (!loadYearTransits(id, year)) void handleCalcYear();
    if (!loadSolarReturn(id)) void handleEnsureSolar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proUnlocked, id]);

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
          <p className="text-sm text-slate-700 mt-3">{t("chart.ready")}</p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-2">
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
        </div>
        {birthData && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareChartUrl(birthData));
                setShareCopied(true);
                window.setTimeout(() => setShareCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="self-start text-sm text-slate-400 hover:text-blue-600 min-h-[44px]"
          >
            {shareCopied ? t("chart.share.copied") : t("chart.share.copy")}
          </button>
        )}
      </div>

      {checkoutBanner && (
        <div
          className={`mb-5 rounded-lg border p-4 text-sm ${
            checkoutBanner === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : checkoutBanner === "cancel"
                ? "bg-slate-50 border-slate-200 text-slate-600"
                : "bg-red-50 border-red-200 text-red-600"
          }`}
          role="status"
        >
          {checkoutBanner === "success"
            ? t("pay.checkout.success")
            : checkoutBanner === "cancel"
              ? t("pay.checkout.cancel")
              : t("pay.checkout.error")}
        </div>
      )}

      {transitError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {t("chart.error.transit")}: {transitError}
        </div>
      )}

      {srError && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          {t("chart.error.solar")}: {srError}
        </div>
      )}

      {loadingTransits && (
        <div className="mb-5 bg-white border border-border rounded-xl p-5 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-700 text-sm mb-1">{t("chart.nav.transits_loading")}</p>
          <p className="text-slate-400 text-xs">{t("chart.loading_hint")}</p>
        </div>
      )}

      {/* 1. Wheel — expectation: "quiero ver mi carta" */}
      <section className="mb-10" aria-labelledby="chart-hero-heading">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-widest text-blue-600 mb-1.5">
            {t("chart.hero.badge")}
          </p>
          <h2
            id="chart-hero-heading"
            className="font-semibold text-xl sm:text-2xl text-slate-900 tracking-tight"
          >
            {t("chart.wheel.title")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t("chart.wheel.hint")}</p>
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
          />
        </div>
      </section>

      {/* 2. Who you are — prevents intimidation */}
      {human && (
        <section className="mb-10 max-w-2xl mx-auto" aria-labelledby="who-heading">
          <p className="text-xs uppercase tracking-widest text-blue-600 mb-1.5">
            {t("chart.who.badge")}
          </p>
          <h2
            id="who-heading"
            className="font-semibold text-2xl sm:text-3xl text-slate-900 tracking-tight"
          >
            {human.headline}
          </h2>
          <p className="text-sm text-slate-500 mt-2 mb-5">{t("chart.who.subtitle")}</p>
          <div className="space-y-3">
            <p className="text-base text-slate-700 leading-relaxed">{human.identity}</p>
            <p className="text-base text-slate-700 leading-relaxed">{human.emotion}</p>
          </div>
        </section>
      )}

      {/* 3. Six topics — real value */}
      <div id="astro-pro-section" className="mb-10">
        <TopicSummarySection
          preview={preview}
          isPro={proUnlocked}
          onUnlock={handleUnlockPro}
          tier1Aspects={tier1Aspects}
          intensityData={intensityData}
          onCalcYear={handleCalcYear}
          yearLoading={loadingTransits}
          yearError={transitError}
          chart={chart}
          chartId={id}
          yearMap={yearMap}
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

    </div>
  );
}
