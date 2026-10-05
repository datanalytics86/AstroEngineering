import { NextRequest, NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { redeemGift } from "@/lib/gifts";
import type { BirthData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: {
    code?: string;
    email?: string;
    locale?: "es" | "en";
    birth?: BirthData;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }
  const code = String(body.code || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const birth = body.birth;
  if (!code || !email || !birth?.birth_date || !birth.birth_time) {
    return NextResponse.json({ detail: "fields_required" }, { status: 400 });
  }
  try {
    const redeemed = await redeemGift({
      code,
      email,
      locale: body.locale === "en" ? "en" : "es",
      birth,
    });
    const res = NextResponse.json({ ok: true, chartId: redeemed.chartId });
    res.cookies.set(
      SESSION_COOKIE,
      encodeSession({
        customerId: redeemed.customerId,
        email: redeemed.email,
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      }),
      sessionCookieOptions(),
    );
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "redeem_failed";
    const status = msg === "gift_not_found" ? 404 : msg === "gift_used" ? 409 : 400;
    return NextResponse.json({ detail: msg }, { status });
  }
}
