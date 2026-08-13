"use client";

/**
 * Freemium section: 6 topic cards (free) + Pro panel
 * (TIER1 aspects, intensity chart, technical summary access).
 */

import { useEffect, useMemo, useState } from "react";
import type {
  Aspect,
  ChartResponse,
  IntensityPoint,
  StrengthLevel,
  TierMinus1Content,
  TierMinus1Section,
  TransitEvent,
} from "@/lib/types";
import { groupTransitsByTopic } from "@/lib/topic-summary";
import { loadYearTransits } from "@/lib/storage";
import {
  buildTier1Readings,
  generateHumanProSummary,
  humanTransitLine,
  readIntensityYear,
} from "@/lib/pro-human";
import ActionButton from "@/components/ActionButton";
import PersonalIntensityChart from "@/components/PersonalIntensityChart";
import DownloadPreviewPdfButton from "@/components/DownloadPreviewPdfButton";
import { useT, type Lang } from "@/lib/i18n";
import { savePayWaitlistEmail, trackLearning } from "@/lib/learning";
import { getProSampleContent } from "@/lib/pro-sample";
import { downloadProSamplePdf } from "@/lib/download-preview-pdf";

export interface TopicSummarySectionProps {
  preview: TierMinus1Content;
  isPro: boolean;
  onUnlock: () => void;
  tier1Aspects: Aspect[];
  intensityData: IntensityPoint[];
  onOpenTechnicalSummary?: () => void;
  onCalcYear?: () => void;
  yearLoading?: boolean;
  yearError?: string | null;
  chart?: ChartResponse;
  chartId?: string;
  onSolar?: () => void;
  solarLoading?: boolean;
}

const STRENGTH_STYLE: Record<
  StrengthLevel,
  { bg: string; text: string; border: string }
> = {
  alta: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  media: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  desafio: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

const TOPIC_ACCENT: Record<string, string> = {
  amor: "#EC4899",
  dinero: "#10B981",
  trabajo: "#3B82F6",
  salud: "#F59E0B",
  familia: "#8B5CF6",
  crecimiento: "#6366F1",
};

function ProPreviewModal({
  lang,
  sampleBusy,
  onClose,
  onDownload,
  onUnlock,
}: {
  lang: Lang;
  sampleBusy: boolean;
  onClose: () => void;
  onDownload: () => void;
  onUnlock: () => void;
}) {
  const { t } = useT();
  const sample = getProSampleContent(lang);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label={t("chart.pro.preview_close")}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-card-md p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="pro-preview-title" className="font-semibold text-lg text-slate-900">
              {t("chart.pro.preview_title")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{t("chart.pro.preview_note")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px]"
            aria-label={t("chart.pro.preview_close")}
          >
            ✕
          </button>
        </div>
        <p className="text-sm font-semibold text-indigo-700 leading-snug">{sample.headline}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{sample.identity}</p>
        <ul className="space-y-2">
          {sample.tier1.slice(0, 3).map((row) => (
            <li key={`${row.left}-${row.right}`} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <p className="text-sm text-slate-600 leading-snug">{row.impact}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-600 leading-relaxed">{sample.yearReading}</p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <ActionButton
            variant="secondary"
            accent="indigo"
            className="w-full sm:flex-1 min-h-[48px]"
            disabled={sampleBusy}
            onClick={onDownload}
          >
            {sampleBusy ? t("chart.pro.preview_downloading") : t("chart.pro.preview_download")}
          </ActionButton>
          <ActionButton
            variant="primary"
            accent="indigo"
            className="w-full sm:flex-1 min-h-[48px]"
            onClick={onUnlock}
          >
            {t("chart.pro.preview_unlock")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

const BADGE_TO_STRENGTH: Record<string, StrengthLevel> = {
  potencial_fuerte: "alta",
  equilibrado: "media",
  area_practica: "desafio",
};

function TopicCard({
  topic,
  onOpened,
}: {
  topic: TierMinus1Section;
  onOpened?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const level = BADGE_TO_STRENGTH[topic.badge] ?? "media";
  const style = STRENGTH_STYLE[level] ?? STRENGTH_STYLE.media;
  const accent = TOPIC_ACCENT[topic.id] ?? "#6366F1";
  const { t } = useT();

  return (
    <article
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card flex flex-col min-h-[44px] hover:border-slate-300 transition-colors"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) onOpened?.();
            return next;
          })
        }
        className="text-left px-4 py-4 sm:px-5 w-full min-h-[48px] hover:bg-slate-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">
              {topic.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-snug">
              {topic.headline}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] sm:text-xs font-mono px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {topic.badgeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topic.keywords.slice(0, 3).map((k) => (
            <span
              key={k}
              className="text-[10px] sm:text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100"
            >
              {k}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs text-blue-600 font-mono" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-3 border-t border-slate-100 pt-3">
          {topic.paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">
              {p}
            </p>
          ))}
          {topic.tips.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                {t("chart.topics.tips")}
              </p>
              <ul className="space-y-1.5">
                {topic.tips.map((tip) => (
                  <li key={tip} className="text-sm text-slate-700 leading-snug">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Tier1List({
  aspects,
  emptyLabel,
  lang,
}: {
  aspects: Aspect[];
  emptyLabel: string;
  lang: Lang;
}) {
  const readings = buildTier1Readings(aspects, lang);
  if (readings.length === 0) {
    return <p className="text-sm text-slate-500 leading-relaxed">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {readings.map(({ aspect: a, impact }) => (
        <li
          key={`${a.planet1}-${a.aspect_name}-${a.planet2}`}
          className="bg-white border border-slate-100 rounded-xl px-3 py-3 space-y-1.5"
        >
          <p className="text-sm text-slate-700 leading-snug">{impact}</p>
        </li>
      ))}
    </ul>
  );
}

export default function TopicSummarySection({
  preview,
  isPro,
  onUnlock,
  tier1Aspects,
  intensityData,
  onOpenTechnicalSummary,
  onCalcYear,
  yearLoading = false,
  yearError = null,
  chart,
  chartId,
  onSolar,
  solarLoading = false,
}: TopicSummarySectionProps) {
  const { t, lang } = useT();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [topicsOpened, setTopicsOpened] = useState(0);
  const [pdfTaken, setPdfTaken] = useState(false);
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const locale: Lang = lang === "en" ? "en" : "es";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout/status")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => {
        if (!cancelled) setCheckoutEnabled(Boolean(d.enabled));
      })
      .catch(() => {
        if (!cancelled) setCheckoutEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startStripeCheckout() {
    if (!chartId || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    trackLearning("checkout_started");
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; detail?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.detail || "checkout_failed");
      }
      window.location.href = data.url;
    } catch {
      trackLearning("checkout_error");
      setCheckoutError(t("pay.checkout.error"));
      setCheckoutBusy(false);
    }
  }

  function requestUnlock() {
    trackLearning("pro_unlock_clicked");
    if (checkoutEnabled) {
      void startStripeCheckout();
      return;
    }
    setPayOpen(true);
  }

  const human = useMemo(
    () => (isPro && chart ? generateHumanProSummary(chart, locale) : null),
    [isPro, chart, locale]
  );

  const yearReading = useMemo(
    () => (isPro ? readIntensityYear(intensityData, locale) : null),
    [isPro, intensityData, locale]
  );

  const transitPreview = useMemo(() => {
    if (!isPro || !chart || !chartId) return null;
    const year = new Date().getFullYear();
    const data = loadYearTransits(chartId, year);
    if (!data) return null;
    const events: TransitEvent[] = [
      ...data.current_transits,
      ...data.timeline.flatMap((m) => m.transits_active),
    ];
    const seen = new Set<string>();
    const unique = events.filter((e) => {
      const k = `${e.transit_planet}|${e.aspect_name}|${e.natal_planet}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return groupTransitsByTopic(chart.planets, unique, locale, (ev) =>
      humanTransitLine(ev, locale)
    );
  }, [isPro, chart, chartId, locale]);

  return (
    <section className="space-y-8" aria-labelledby="topic-summaries-heading">
      {/* FREE: 6 topic cards — dominant value */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-600 mb-1.5">
              {t("chart.topics.badge")}
            </p>
            <h2
              id="topic-summaries-heading"
              className="font-semibold text-2xl sm:text-3xl text-slate-900 tracking-tight"
            >
              {t("chart.topics.title")}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
              {t("chart.topics.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <span className="self-start sm:self-end text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {t("chart.topics.free_badge")}
            </span>
            <DownloadPreviewPdfButton
              content={preview}
              onDownloaded={() => setPdfTaken(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {preview.sections.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onOpened={() => {
                setTopicsOpened((n) => n + 1);
                trackLearning("topics_opened");
              }}
            />
          ))}
        </div>
        {!isPro && (topicsOpened >= 2 || pdfTaken) && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-slate-700">{t("chart.pro.soft_chip")}</p>
            <button
              type="button"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 min-h-[44px] text-left"
              onClick={() =>
                document
                  .getElementById("pro-unlock-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {t("chart.pro.soft_chip_cta")}
            </button>
          </div>
        )}
      </div>

      {/* PRO block — engineering upgrade */}
      <div
        id="pro-unlock-panel"
        className="rounded-2xl border border-indigo-100 bg-slate-50 overflow-hidden shadow-card"
      >
        <div className="border-l-4 border-indigo-500 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-600 mb-1.5">
                {t("chart.pro.badge")}
              </p>
              <h3 className="font-semibold text-lg sm:text-xl text-slate-900">
                {isPro ? t("chart.pro.title_unlocked") : t("chart.pro.teaser.title")}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {isPro
                  ? t("chart.pro.unlocked_subtitle_paid")
                  : t("chart.pro.teaser.body")}
              </p>
            </div>
            {isPro ? (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                {t("chart.pro.unlocked_badge")}
              </span>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white text-slate-500 border border-slate-200">
                {t("chart.pro.locked_badge")}
              </span>
            )}
          </div>

          {!isPro && (
            <>
              {preview.sections[0]?.headline && (
                <div className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-1.5">
                    {t("chart.pro.teaser.locked_label")}
                  </p>
                  <p className="text-sm text-slate-700 leading-snug blur-[5px] select-none">
                    {preview.sections[0].headline}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-36 shrink-0">{t("chart.pro.teaser.peak")}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-36 shrink-0">{t("chart.pro.teaser.ease")}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-[30%] bg-indigo-300 rounded-full" />
                  </div>
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  t("chart.pro.feature.summary"),
                  t("chart.pro.feature.intensity"),
                  t("chart.pro.feature.tier1"),
                  t("chart.pro.feature.transits"),
                ].map((label) => (
                  <li
                    key={label}
                    className="text-xs sm:text-sm text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2.5 flex items-start gap-2 min-h-[44px]"
                  >
                    <span className="text-indigo-500 mt-0.5 shrink-0" aria-hidden>
                      ·
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <ActionButton
                  variant="secondary"
                  accent="indigo"
                  onClick={() => {
                    trackLearning("pro_preview_opened");
                    setPreviewOpen(true);
                  }}
                  className="w-full sm:w-auto min-h-[48px] text-base"
                >
                  {t("chart.pro.preview_cta")}
                </ActionButton>
                <ActionButton
                  variant="primary"
                  accent="indigo"
                  onClick={requestUnlock}
                  className="w-full sm:w-auto min-h-[48px] text-base"
                  disabled={checkoutBusy}
                >
                  {checkoutBusy
                    ? t("pay.checkout.redirecting")
                    : checkoutEnabled
                      ? t("chart.pro.unlock_cta")
                      : t("chart.pro.unlock_cta_trial")}
                </ActionButton>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  {checkoutEnabled ? t("chart.pro.unlock_note_live") : t("chart.pro.unlock_note")}
                </p>
              </div>
              {checkoutError && (
                <p className="text-sm text-red-600" role="alert">
                  {checkoutError}
                </p>
              )}
            </>
          )}

          {previewOpen && !isPro && (
            <ProPreviewModal
              lang={locale}
              sampleBusy={sampleBusy}
              onClose={() => setPreviewOpen(false)}
              onDownload={async () => {
                setSampleBusy(true);
                try {
                  await downloadProSamplePdf(locale);
                } finally {
                  setSampleBusy(false);
                }
              }}
              onUnlock={() => {
                setPreviewOpen(false);
                requestUnlock();
              }}
            />
          )}

          {payOpen && !isPro && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pay-intent-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/40"
                aria-label={t("pay.intent.close")}
                onClick={() => setPayOpen(false)}
              />
              <div className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-card-md p-5 sm:p-6 space-y-4">
                <h3 id="pay-intent-title" className="font-semibold text-lg text-slate-900">
                  {t("pay.intent.title")}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t("pay.intent.body")}</p>
                <p className="text-sm font-medium text-slate-800">{t("pay.intent.question")}</p>
                <label className="block text-xs text-slate-500">
                  {t("pay.intent.email_label")}
                  <input
                    type="email"
                    value={payEmail}
                    onChange={(e) => setPayEmail(e.target.value)}
                    placeholder={t("pay.intent.email_placeholder")}
                    className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 min-h-[44px]"
                  />
                </label>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <ActionButton
                    variant="primary"
                    accent="indigo"
                    className="w-full sm:flex-1 min-h-[48px]"
                    onClick={() => {
                      savePayWaitlistEmail(payEmail);
                      trackLearning("pay_intent_yes");
                      setPayOpen(false);
                      onUnlock();
                    }}
                  >
                    {t("pay.intent.yes")}
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    accent="indigo"
                    className="w-full sm:flex-1 min-h-[48px]"
                    onClick={() => {
                      savePayWaitlistEmail(payEmail);
                      trackLearning("pay_intent_no");
                      setPayOpen(false);
                    }}
                  >
                    {t("pay.intent.no")}
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {isPro && (
            <div className="space-y-7 pt-2 border-t border-slate-200/80">
              {/* 1. Human summary */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                    {t("chart.pro.section.summary")}
                  </h4>
                  {onOpenTechnicalSummary && (
                    <ActionButton
                      variant="secondary"
                      accent="blue"
                      onClick={onOpenTechnicalSummary}
                      className="!py-2 !px-3 text-xs min-h-[44px]"
                    >
                      {t("chart.pro.open_summary")}
                    </ActionButton>
                  )}
                </div>
                {human && (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-indigo-700 leading-snug">
                      {human.headline}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{human.identity}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{human.purpose}</p>
                  </div>
                )}
              </div>

              {/* 2. Year pulse — one empty CTA */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                  {t("chart.pro.section.year")}
                </h4>
                {yearLoading ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-5 text-center">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-600">{t("chart.pro.year.loading")}</p>
                  </div>
                ) : intensityData.length > 0 ? (
                  <div className="space-y-3">
                    {yearReading && (
                      <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-1.5">
                        <p className="text-sm font-semibold text-slate-900">{yearReading.headline}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{yearReading.body}</p>
                      </div>
                    )}
                    <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                      <PersonalIntensityChart data={intensityData} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t("chart.pro.intensity.explain")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-indigo-200 rounded-xl p-5 space-y-3 text-center sm:text-left">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {t("chart.pro.intensity.empty")}
                    </p>
                    {yearError && (
                      <p className="text-sm text-red-600" role="alert">
                        {yearError}
                      </p>
                    )}
                    {onCalcYear && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <ActionButton
                          variant="primary"
                          accent="indigo"
                          onClick={onCalcYear}
                          className="w-full sm:w-auto min-h-[48px]"
                        >
                          {t("chart.pro.intensity.cta_transits")}
                        </ActionButton>
                        <p className="text-[11px] text-slate-400">
                          {t("chart.pro.intensity.cta_note")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. TIER1 with meaning */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                  {t("chart.pro.tier1.title")}
                </h4>
                <Tier1List
                  aspects={tier1Aspects}
                  emptyLabel={t("chart.pro.tier1_empty")}
                  lang={locale}
                />
              </div>

              {/* 4. Year by topic — only with data */}
              {intensityData.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                    {t("chart.pro.section.transits")}
                  </h4>
                  {transitPreview && transitPreview.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {transitPreview.map((g) => (
                        <div
                          key={g.topicId}
                          className="bg-white border border-slate-100 rounded-xl p-3"
                        >
                          <button
                            type="button"
                            className="w-full text-left flex items-center justify-between gap-2 min-h-[44px]"
                            onClick={() =>
                              setExpandedTopic((prev) =>
                                prev === g.topicId ? null : g.topicId
                              )
                            }
                          >
                            <span className="text-sm font-semibold text-slate-800">{g.title}</span>
                            <span className="text-xs font-mono text-slate-400">{g.items.length}</span>
                          </button>
                          {(expandedTopic === g.topicId || expandedTopic === null) && (
                            <ul className="mt-2 space-y-1">
                              {(expandedTopic === g.topicId
                                ? g.items
                                : g.items.slice(0, 2)
                              ).map((item) => (
                                <li
                                  key={item}
                                  className="text-sm text-slate-600 leading-snug"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">{t("chart.pro.transits_empty")}</p>
                  )}
                </div>
              )}
              {onSolar && (
                <button
                  type="button"
                  onClick={onSolar}
                  disabled={solarLoading}
                  className="text-sm text-slate-500 hover:text-indigo-700 min-h-[44px] disabled:opacity-50"
                >
                  {solarLoading
                    ? t("chart.nav.transits_loading")
                    : t("chart.nav.solar_link").replace("{year}", String(new Date().getFullYear()))}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
