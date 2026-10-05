import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { activeEntitlement, hasActiveEntitlement } from "@/lib/billing/fulfill";
import { decryptJson } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { buildYearMapV2 } from "@/lib/pro/build-year-map";
import { nextCalendarWindow, rangeForWindow, rollingWindow } from "@/lib/pro/window";
import { proxyHeaders } from "@/lib/backend-proxy";
import { backendUrl } from "@/lib/site";
import type { BirthData, ChartResponse, TransitResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  let body: { chart_id?: string; lang?: "es" | "en"; sku?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }
  const ok = await hasActiveEntitlement(session.customerId);
  if (!ok) return NextResponse.json({ detail: "forbidden" }, { status: 403 });
  const store = await getStore();
  const ents = (await store.listEntitlements(session.customerId)).filter((e) =>
    activeEntitlement(e),
  );
  const ent =
    ents.find((e) => e.chart_id && e.chart_id === body.chart_id) ||
    ents.find((e) => e.chart_id);
  const chartRow = ent?.chart_id
    ? await store.getChart(ent.chart_id)
    : body.chart_id
      ? await store.getChart(body.chart_id)
      : null;
  if (!chartRow) return NextResponse.json({ detail: "chart_missing" }, { status: 404 });
  const birth = decryptJson<BirthData>(chartRow.birth_enc);
  const natal = await fetchJson<ChartResponse>("/api/chart", {
    method: "POST",
    headers: { ...proxyHeaders(req, { "Content-Type": "application/json" }) },
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
  if (!natal) return NextResponse.json({ detail: "upstream" }, { status: 503 });
  const win =
    body.sku === "year_map_next" || ent?.sku === "year_map_next"
      ? nextCalendarWindow()
      : rollingWindow();
  const range = rangeForWindow(win.months);
  const transits = await fetchJson<TransitResponse>("/api/transits", {
    method: "POST",
    headers: { ...proxyHeaders(req, { "Content-Type": "application/json" }) },
    body: JSON.stringify({
      natal_planets: natal.planets,
      start_date: range.start_date,
      end_date: range.end_date,
      latitude: birth.latitude,
      longitude: birth.longitude,
    }),
  });
  if (!transits) return NextResponse.json({ detail: "upstream" }, { status: 503 });
  const map = buildYearMapV2({
    transits,
    months: win.months,
    kind: win.kind === "calendar" ? "calendar" : "rolling12",
    lang: body.lang === "en" ? "en" : "es",
    currentMonthKey: win.start,
  });
  return NextResponse.json(map);
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${backendUrl()}${path}`, { ...init, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
