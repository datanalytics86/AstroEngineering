import type { NextRequest } from "next/server";
import { activeEntitlement, hasActiveEntitlement } from "@/lib/billing/fulfill";
import { decryptJson } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { buildYearMapV2 } from "@/lib/pro/build-year-map";
import { nextCalendarWindow, rangeForWindow, rollingWindow } from "@/lib/pro/window";
import { proxyHeaders } from "@/lib/backend-proxy";
import { backendUrl } from "@/lib/site";
import type { BirthData, ChartResponse, TransitResponse } from "@/lib/types";
import type { YearMapContentV2 } from "@/lib/pro/build-year-map";

export async function loadYearMapForCustomer(
  customerId: string,
  opts: { chartId?: string | null; lang?: "es" | "en"; sku?: string; req?: NextRequest },
): Promise<{ map: YearMapContentV2; lang: "es" | "en" } | { error: string; status: number }> {
  const ok = await hasActiveEntitlement(customerId);
  if (!ok) return { error: "forbidden", status: 403 };
  const store = await getStore();
  const ents = (await store.listEntitlements(customerId)).filter((e) => activeEntitlement(e));
  const ent =
    ents.find((e) => e.chart_id && e.chart_id === opts.chartId) ||
    ents.find((e) => e.chart_id);
  const chartRow = ent?.chart_id
    ? await store.getChart(ent.chart_id)
    : opts.chartId
      ? await store.getChart(opts.chartId)
      : null;
  if (!chartRow) return { error: "chart_missing", status: 404 };
  const birth = decryptJson<BirthData>(chartRow.birth_enc);
  const headers = proxyHeaders(opts.req, { "Content-Type": "application/json" });
  const natal = await fetchJson<ChartResponse>("/api/chart", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: birth.name,
      birth_date: birth.birth_date,
      birth_time: birth.birth_time,
      latitude: birth.latitude,
      longitude: birth.longitude,
      timezone_offset: birth.timezone_offset ?? 0,
      tz_name: birth.tz_name,
    }),
  });
  if (!natal) return { error: "upstream", status: 503 };
  const win =
    opts.sku === "year_map_next" || ent?.sku === "year_map_next"
      ? nextCalendarWindow()
      : rollingWindow();
  const range = rangeForWindow(win.months);
  const transits = await fetchJson<TransitResponse>("/api/transits", {
    method: "POST",
    headers,
    body: JSON.stringify({
      natal_planets: natal.planets,
      start_date: range.start_date,
      end_date: range.end_date,
      latitude: birth.latitude,
      longitude: birth.longitude,
    }),
  });
  if (!transits) return { error: "upstream", status: 503 };
  const lang = opts.lang === "en" ? "en" : "es";
  const map = buildYearMapV2({
    transits,
    months: win.months,
    kind: win.kind === "calendar" ? "calendar" : "rolling12",
    lang,
    currentMonthKey: win.start,
  });
  return { map, lang };
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${backendUrl()}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
