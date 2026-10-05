import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CATALOG, currencyFromCountry, isSkuActive, priceOf, type Sku } from "@/lib/billing/catalog";
import { getProvider } from "@/lib/billing";
import { mockCouponForRef, REF_COOKIE, sanitizeRef } from "@/lib/billing/referral";
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
    gift_recipient_email?: string;
    gift_deliver_at?: string;
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
  const isGift = sku === "year_map_gift";
  const birth = body.birth;
  if (!isGift && (!birth?.birth_date || !birth.birth_time)) {
    return NextResponse.json({ detail: "birth_required" }, { status: 400 });
  }
  const giftRecipient = isGift
    ? String(body.gift_recipient_email || "").trim().toLowerCase()
    : null;
  if (isGift && (!giftRecipient || !giftRecipient.includes("@"))) {
    return NextResponse.json({ detail: "gift_recipient_required" }, { status: 400 });
  }
  let giftDeliverAt: string | null = null;
  if (isGift) {
    if (body.gift_deliver_at) {
      const d = new Date(body.gift_deliver_at);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ detail: "gift_deliver_invalid" }, { status: 400 });
      }
      giftDeliverAt = d.toISOString();
    } else {
      giftDeliverAt = new Date().toISOString();
    }
  }
  const ref = sanitizeRef(body.ref) || sanitizeRef(req.cookies.get(REF_COOKIE)?.value);
  const origin = requestOriginFrom(req);
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ detail: "origin_forbidden" }, { status: 400 });
  }
  const currency = currencyFromCountry(req.headers.get("x-vercel-ip-country"));
  const price = priceOf(sku, currency);
  const win = sku === "year_map_next" ? nextCalendarWindow() : rollingWindow();
  const store = await getStore();
  const orderId = randomUUID();
  let chartId: string | null = null;
  if (birth?.birth_date && birth.birth_time) {
    chartId = randomUUID();
    await store.insertChart({
      id: chartId,
      customer_id: null,
      fingerprint: fingerprintBirth(birth),
      birth_enc: encryptJson(birth),
    });
  }
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
    ref,
    gift_recipient_email: giftRecipient,
    gift_deliver_at: giftDeliverAt,
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
    ref: ref ?? undefined,
    coupon: ref ? mockCouponForRef(ref) : undefined,
  });
  const res = NextResponse.json({ url, orderId });
  res.cookies.set(PENDING_COOKIE, orderId, pendingCookieOptions());
  return res;
}
