import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CATALOG, currencyFromCountry, isSkuActive, priceOf, type Sku } from "@/lib/billing/catalog";
import { getProvider } from "@/lib/billing";
import { encryptJson, fingerprintBirth } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { checkoutOpen, proMode } from "@/lib/pro/mode";
import { nextCalendarWindow, rollingWindow } from "@/lib/pro/window";
import { isAllowedOrigin, requestOriginFrom } from "@/lib/site";
import { pendingCookieOptions, PENDING_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkoutOpen()) {
    return NextResponse.json({ mode: proMode(), detail: "waitlist" }, { status: 409 });
  }
  let body: {
    sku?: string;
    birth?: {
      name: string;
      birth_date: string;
      birth_time: string;
      latitude: number;
      longitude: number;
      timezone_offset?: number;
      tz_name?: string;
      city?: string;
    };
    email?: string;
    locale?: "es" | "en";
    ref?: string;
    ph_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }
  const sku = (body.sku || "year_map") as Sku;
  if (!CATALOG[sku] || !isSkuActive(sku)) {
    return NextResponse.json({ detail: "sku_unavailable" }, { status: 400 });
  }
  const birth = body.birth;
  if (!birth?.birth_date || !birth.birth_time) {
    return NextResponse.json({ detail: "birth_required" }, { status: 400 });
  }
  const origin = requestOriginFrom(req);
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ detail: "origin_forbidden" }, { status: 400 });
  }
  const currency = currencyFromCountry(req.headers.get("x-vercel-ip-country"));
  const price = priceOf(sku, currency);
  const win = sku === "year_map_next" ? nextCalendarWindow() : rollingWindow();
  const store = await getStore();
  const chartId = randomUUID();
  const orderId = randomUUID();
  await store.insertChart({
    id: chartId,
    customer_id: null,
    fingerprint: fingerprintBirth(birth),
    birth_enc: encryptJson(birth),
  });
  await store.insertOrder({
    id: orderId,
    provider: getProvider().id,
    provider_order_id: null,
    customer_id: null,
    sku,
    amount_minor: price.amountMinor,
    currency: price.currency,
    status: "pending",
    window_start: win.start,
    window_end: win.end,
    chart_id: chartId,
    email: body.email?.trim().toLowerCase() || null,
    locale: body.locale === "en" ? "en" : "es",
    ph_id: body.ph_id || null,
  });
  const successUrl = `${origin}/pro/gracias?order=${orderId}`;
  const cancelUrl = `${origin}/pro?checkout=cancel`;
  const { url } = await getProvider().createCheckout({
    orderId,
    sku,
    currency: price.currency,
    email: body.email,
    locale: body.locale === "en" ? "en" : "es",
    successUrl,
    cancelUrl,
  });
  const res = NextResponse.json({ url, orderId });
  res.cookies.set(PENDING_COOKIE, orderId, pendingCookieOptions());
  return res;
}
