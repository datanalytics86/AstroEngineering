"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useT, type Lang } from "@/lib/i18n";
import { getWithWakingRetry } from "@/lib/api-fetch";
import { saveCalendar, loadCalendar } from "@/lib/storage";
import { SIGN_SYMBOLS } from "@/lib/zodiac-utils";
import { getEventReading, getMoonSignReading, getFastTransitReading, getSlowTransitReading } from "@/lib/calendar-corpus";
import type { CalendarResponse, CalendarMonth, CalendarDay, CalendarEvent, CalendarFastPos, CalendarSlowSegment } from "@/lib/types";

const EVENT_ICON: Record<string, string> = {
  ingress: "→",
  station: "℞",
  eclipse: "◐",
};

const PHASE_ICON: Record<string, string> = {
  nueva: "🌑",
  creciente: "🌓",
  llena: "🌕",
  menguante: "🌗",
};

const ASPECT_ICON: Record<string, string> = {
  "Conjunción": "☌",
  Sextil: "⚹",
  Cuadratura: "□",
  "Trígono": "△",
  "Oposición": "☍",
};

function eventIcon(e: CalendarEvent): string {
  if (e.type === "moon_phase") return PHASE_ICON[e.phase ?? ""] ?? "●";
  if (e.type === "aspect") return ASPECT_ICON[e.aspect ?? ""] ?? "⚹";
  if (e.type === "station") return e.station === "direct" ? "D" : "℞";
  return EVENT_ICON[e.type] ?? "•";
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const WEEKDAY_KEYS = ["cal.weekday.mon", "cal.weekday.tue", "cal.weekday.wed", "cal.weekday.thu", "cal.weekday.fri", "cal.weekday.sat", "cal.weekday.sun"] as const;

/** Índice de columna lun=0..dom=6 para una fecha YYYY-MM-DD (sin desfase de huso horario). */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay(); // 0=dom..6=sáb
  return (jsDay + 6) % 7; // 0=lun..6=dom
}

export default function CalendarioPage() {
  const { t, lang } = useT();
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState(false);
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [baseYear, setBaseYear] = useState<number | null>(null);
  const [baseMonth, setBaseMonth] = useState<number | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    setBaseYear(now.getFullYear());
    setBaseMonth(now.getMonth() + 1);
  }, []);

  const fetchCalendar = useCallback(async (year: number, month: number, skipCache = false) => {
    setLoading(true);
    setError(false);
    setWaking(false);

    if (!skipCache) {
      const cached = loadCalendar(year, month);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await getWithWakingRetry(`/api/calendar?year=${year}&month=${month}`, () => setWaking(true));
      setWaking(false);
      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      const json: CalendarResponse = await res.json();
      setData(json);
      saveCalendar(year, month, json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (baseYear && baseMonth) {
      fetchCalendar(baseYear, baseMonth);
    }
  }, [baseYear, baseMonth, fetchCalendar]);

  const months = data?.months ?? [];
  const activeMonth: CalendarMonth | undefined = months[activeMonthIdx];

  const dayByDate = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const m of months) {
      for (const d of m.days) map.set(d.date, d);
    }
    return map;
  }, [months]);

  const today = todayISO();
  const selectedDay = dayByDate.get(selectedDate) ?? null;
  const todayDay = dayByDate.get(today) ?? null;

  function selectDay(iso: string) {
    setSelectedDate(iso);
    setFocusedDate(iso);
  }

  function selectToday() {
    setSelectedDate(today);
    // saltar al mes que contiene hoy
    const idx = months.findIndex((m) => m.days.some((d) => d.date === today));
    if (idx >= 0) setActiveMonthIdx(idx);
    setFocusedDate(today);
  }

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent, iso: string) => {
      if (!activeMonth) return;
      const dates = activeMonth.days.map((d) => d.date);
      const idx = dates.indexOf(iso);
      let nextIdx: number | null = null;
      if (e.key === "ArrowRight") nextIdx = idx + 1;
      else if (e.key === "ArrowLeft") nextIdx = idx - 1;
      else if (e.key === "ArrowDown") nextIdx = idx + 7;
      else if (e.key === "ArrowUp") nextIdx = idx - 7;
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectDay(iso);
        return;
      }
      if (nextIdx !== null && nextIdx >= 0 && nextIdx < dates.length) {
        e.preventDefault();
        const nextDate = dates[nextIdx];
        setFocusedDate(nextDate);
        requestAnimationFrame(() => {
          const el = gridRef.current?.querySelector<HTMLElement>(`[data-day="${nextDate}"]`);
          el?.focus();
        });
      }
    },
    [activeMonth],
  );

  const monthLabel = (m: CalendarMonth) => {
    const names = lang === "es"
      ? ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${names[m.month - 1]} ${m.year}`;
  };

  // Padding inicial para que el día 1 caiga en su columna correcta (lun=0)
  const leadingBlanks = activeMonth && activeMonth.days.length > 0 ? weekdayIndex(activeMonth.days[0].date) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">{t("cal.title")}</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">{t("cal.subtitle")}</p>
      </div>

      {/* Franja "hoy" */}
      {todayDay && (
        <button
          type="button"
          onClick={selectToday}
          className="w-full text-left bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-6 hover:bg-teal-100 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 motion-safe:transition-colors"
        >
          <span className="font-mono text-sm text-teal-800">
            {t("cal.today.label")} · {t("cal.detail.moon")} {todayDay.moon.sign} {SIGN_SYMBOLS[todayDay.moon.sign] ?? ""}
            {todayDay.events.length > 0 ? ` · ${eventIcon(todayDay.events[0])} ${t(`cal.event.${todayDay.events[0].type}` as never)}` : ` · ${t("cal.today.no_events")}`}
          </span>
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{t("cal.error.waking")}</span>
          <button
            type="button"
            onClick={() => baseYear && baseMonth && fetchCalendar(baseYear, baseMonth, true)}
            className="font-mono text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            {t("cal.error.retry")}
          </button>
        </div>
      )}

      {waking && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
          {t("common.error.waking")}
        </div>
      )}

      {loading && !data && <p className="text-slate-400 text-sm">{t("cal.loading")}</p>}

      {months.length > 0 && (
        <>
          {/* Tabs de meses */}
          <div className="flex gap-2 mb-4" role="tablist" aria-label={t("cal.title")}>
            {months.map((m, idx) => (
              <button
                key={`${m.year}-${m.month}`}
                type="button"
                role="tab"
                aria-selected={idx === activeMonthIdx}
                onClick={() => setActiveMonthIdx(idx)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-mono transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  idx === activeMonthIdx
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            {/* Grilla desktop / sm+ */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono text-slate-400 mb-1">
                {WEEKDAY_KEYS.map((k) => (
                  <div key={k}>{t(k)}</div>
                ))}
              </div>
              <div ref={gridRef} className="grid grid-cols-7 gap-1">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {activeMonth?.days.map((d) => {
                  const isToday = d.date === today;
                  const isSelected = d.date === selectedDate;
                  const dayNum = Number(d.date.split("-")[2]);
                  const ariaLabel = `${dayNum} ${t("cal.aria.day")} ${d.moon.sign}${d.events.length ? `, ${d.events.length} ${t("cal.aria.events")}` : ""}`;
                  return (
                    <div
                      key={d.date}
                      data-day={d.date}
                      role="button"
                      tabIndex={focusedDate === d.date || (!focusedDate && isSelected) ? 0 : -1}
                      aria-label={ariaLabel}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => selectDay(d.date)}
                      onKeyDown={(e) => handleGridKeyDown(e, d.date)}
                      onFocus={() => setFocusedDate(d.date)}
                      className={`min-h-[64px] sm:min-h-[72px] rounded-lg border p-1.5 text-left cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 motion-reduce:transition-none ${
                        isSelected ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"
                      } ${isToday ? "ring-2 ring-teal-400" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-500">{dayNum}</span>
                        <span className="text-xs">{SIGN_SYMBOLS[d.moon.sign] ?? ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {d.events.slice(0, 4).map((e, i) => (
                          <span key={i} className="text-[10px] leading-none">{eventIcon(e)}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tránsitos lentos del mes (telón de fondo) */}
              <SlowTransitsBlock month={activeMonth} lang={lang} t={t} />

              {/* Leyenda */}
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-mono uppercase text-[10px] text-slate-400">{t("cal.legend.title")}:</span>
                <span>→ {t("cal.legend.ingress")}</span>
                <span>🌕 {t("cal.legend.moon_phase")}</span>
                <span>℞ {t("cal.legend.station")}</span>
                <span>⚹ □ ☌ {t("cal.legend.aspect")}</span>
                <span>◐ {t("cal.legend.eclipse")}</span>
              </div>
            </div>

            {/* Lista móvil */}
            <MobileList
              month={activeMonth}
              selectedDate={selectedDate}
              today={today}
              onSelect={selectDay}
              t={t}
            />

            {/* Panel de detalle */}
            <div>
              <DayDetail day={selectedDay} lang={lang} t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MobileList({
  month,
  selectedDate,
  today,
  onSelect,
  t,
}: {
  month: CalendarMonth | undefined;
  selectedDate: string;
  today: string;
  onSelect: (iso: string) => void;
  t: (k: never) => string;
}) {
  if (!month) return null;
  const withEvents = month.days.filter((d) => d.events.length > 0);
  const withoutEvents = month.days.filter((d) => d.events.length === 0);
  const [showEmpty, setShowEmpty] = useState(false);
  return (
    <div className="sm:hidden">
      <p className="text-xs text-slate-400 mb-2">{t("cal.mobile.hint" as never)}</p>
      <ul className="space-y-1.5">
        {withEvents.map((d) => {
          const dayNum = Number(d.date.split("-")[2]);
          const isSelected = d.date === selectedDate;
          const isToday = d.date === today;
          return (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => onSelect(d.date)}
                className={`w-full min-h-[44px] text-left rounded-lg border px-3 py-2 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isSelected ? "border-teal-500 bg-teal-50" : "border-slate-200"
                } ${isToday ? "ring-1 ring-teal-400" : ""}`}
              >
                <span className="font-mono text-sm text-slate-600 w-6">{dayNum}</span>
                <span className="text-xs">{SIGN_SYMBOLS[d.moon.sign] ?? ""}</span>
                <span className="flex gap-1 ml-1">
                  {d.events.map((e, i) => (
                    <span key={i} className="text-xs">{eventIcon(e)}</span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {withoutEvents.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowEmpty((v) => !v)}
            className="text-xs font-mono text-teal-600 min-h-[44px]"
          >
            {t("cal.list.no_events_group" as never)} ({withoutEvents.length})
          </button>
          {showEmpty && (
            <ul className="mt-1 space-y-1">
              {withoutEvents.map((d) => {
                const dayNum = Number(d.date.split("-")[2]);
                return (
                  <li key={d.date}>
                    <button
                      type="button"
                      onClick={() => onSelect(d.date)}
                      className="w-full min-h-[44px] text-left rounded-lg border border-slate-100 px-3 py-2 flex items-center gap-2 text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <span className="font-mono text-sm w-6">{dayNum}</span>
                      <span className="text-xs">{SIGN_SYMBOLS[d.moon.sign] ?? ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DayDetail({ day, lang, t }: { day: CalendarDay | null; lang: Lang; t: (k: never) => string }) {
  if (!day) return null;
  const dateObj = new Date(day.date + "T12:00:00");
  const dateLabel = dateObj.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Luna primero, luego Sol/Mercurio/Venus/Marte (ya viene en ese orden del backend)
  const fastList = day.fast ?? [];
  return (
    <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-5">
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("cal.detail.title" as never)}</p>
      <p className="font-semibold text-slate-800 capitalize mb-4">{dateLabel}</p>

      {/* Tránsitos rápidos */}
      {fastList.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("cal.fast.title" as never)}</p>
          <div className="space-y-2.5">
            {fastList.map((f) => (
              <FastPosRow key={f.name} pos={f} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* Eventos del día */}
      <div className="mb-4">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("cal.events.title" as never)}</p>
        {day.events.length === 0 ? (
          <p className="text-sm text-slate-400">{t("cal.detail.no_events" as never)}</p>
        ) : (
          <div className="space-y-3">
            {day.events.map((e, i) => {
              const reading = getEventReading(e, lang);
              return (
                <div key={i} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <span>{eventIcon(e)}</span> {reading.title}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{reading.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-300 mt-4 pt-3 border-t border-slate-100">{t("cal.disclaimer" as never)}</p>
    </div>
  );
}

function FastPosRow({ pos, lang }: { pos: CalendarFastPos; lang: Lang }) {
  const reading = getFastTransitReading(pos.name, pos.sign, lang);
  return (
    <div className="text-sm">
      <p className="text-slate-700 flex items-center gap-1.5">
        <span>{SIGN_SYMBOLS[pos.sign] ?? ""}</span>
        <span className="font-medium">
          {pos.name} {lang === "es" ? "en" : "in"} {pos.sign}
        </span>
        <span className="text-slate-400 font-mono text-xs">({pos.degree_in_sign.toFixed(1)}°)</span>
        {pos.retrograde && (
          <span className="text-[10px] font-mono bg-red-50 text-red-600 border border-red-200 rounded px-1 py-0.5">℞</span>
        )}
      </p>
      {reading && <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{reading}</p>}
    </div>
  );
}

function SlowTransitsBlock({ month, lang, t }: { month: CalendarMonth | undefined; lang: Lang; t: (k: never) => string }) {
  const [open, setOpen] = useState(false);
  if (!month || !month.slow || month.slow.length === 0) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden w-full min-h-[44px] flex items-center justify-between text-left text-xs font-mono uppercase tracking-wide text-slate-500 focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <span>{t("cal.slow.title" as never)}</span>
        <span>{open ? t("cal.slow.collapse.hide" as never) : t("cal.slow.collapse.show" as never)}</span>
      </button>
      <p className="hidden sm:block text-xs font-mono uppercase tracking-wide text-slate-500 mb-1">{t("cal.slow.title" as never)}</p>
      <div className={`${open ? "block" : "hidden"} sm:block mt-2`}>
        <p className="text-[11px] text-slate-400 mb-2">{t("cal.slow.note" as never)}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {month.slow.map((seg, i) => (
            <SlowSegmentCard key={`${seg.name}-${i}`} seg={seg} lang={lang} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlowSegmentCard({ seg, lang, t }: { seg: CalendarSlowSegment; lang: Lang; t: (k: never) => string }) {
  const reading = getSlowTransitReading(seg.name, seg.sign, lang);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
        <span>{SIGN_SYMBOLS[seg.sign] ?? ""}</span>
        <span>{seg.name} {lang === "es" ? "en" : "in"} {seg.sign}</span>
        {seg.retrograde_mid && (
          <span className="text-[10px] font-mono bg-red-50 text-red-600 border border-red-200 rounded px-1 py-0.5" title={t("cal.slow.retro_mid" as never)}>℞</span>
        )}
      </p>
      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{seg.from_date} → {seg.to_date}</p>
      {reading && <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{reading}</p>}
    </div>
  );
}
