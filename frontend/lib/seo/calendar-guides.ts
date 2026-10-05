import { backendUrl } from "@/lib/site";
import { getRetroMeaning } from "@/lib/retro-meanings";
import { getMoonPhaseReading } from "@/lib/calendar-corpus";
import type { CalendarMonth, MoonPhaseName, StationType } from "@/lib/types";

export interface StationHit {
  date: string;
  station: StationType;
  sign?: string;
}

export interface LunationHit {
  date: string;
  phase: MoonPhaseName;
  sign?: string;
}

export async function fetchCalendarMonth(year: number, month: number): Promise<CalendarMonth | null> {
  try {
    const res = await fetch(`${backendUrl()}/api/calendar?year=${year}&month=${month}`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as CalendarMonth;
  } catch {
    return null;
  }
}

export async function fetchCalendarYear(year: number): Promise<CalendarMonth[]> {
  const months = await Promise.all(
    Array.from({ length: 12 }, (_, i) => fetchCalendarMonth(year, i + 1)),
  );
  return months.filter((m): m is CalendarMonth => Boolean(m));
}

export function extractMercuryStations(months: CalendarMonth[]): StationHit[] {
  const out: StationHit[] = [];
  for (const m of months) {
    for (const d of m.days || []) {
      for (const e of d.events || []) {
        const body = (e.body || "").toLowerCase();
        if (e.type === "station" && e.station && (body === "mercurio" || body === "mercury")) {
          out.push({ date: d.date, station: e.station, sign: e.sign ?? undefined });
        }
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function pairRetroPeriods(stations: StationHit[]): { start: string; end?: string; sign?: string }[] {
  const periods: { start: string; end?: string; sign?: string }[] = [];
  let open: StationHit | null = null;
  for (const s of stations) {
    if (s.station === "retrograde") {
      open = s;
    } else if (s.station === "direct" && open) {
      periods.push({ start: open.date, end: s.date, sign: open.sign });
      open = null;
    }
  }
  if (open) periods.push({ start: open.date, sign: open.sign });
  return periods;
}

export function extractLunations(months: CalendarMonth[]): LunationHit[] {
  const out: LunationHit[] = [];
  for (const m of months) {
    for (const d of m.days || []) {
      for (const e of d.events || []) {
        if (e.type === "moon_phase" && (e.phase === "nueva" || e.phase === "llena")) {
          out.push({ date: d.date, phase: e.phase, sign: e.sign ?? undefined });
        }
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function mercuryCopy(lang: "es" | "en") {
  const meaning = getRetroMeaning("Mercurio", lang);
  return {
    title: meaning?.title ?? (lang === "en" ? "Mercury retrograde" : "Mercurio retrógrado"),
    meaning: meaning?.meaning ?? "",
    advice: meaning?.advice ?? "",
  };
}

export function lunationCopy(phase: MoonPhaseName, lang: "es" | "en") {
  return getMoonPhaseReading(phase, lang);
}
