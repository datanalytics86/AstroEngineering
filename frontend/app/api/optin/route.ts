import { NextRequest, NextResponse } from "next/server";
import { hashToken, randomToken } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email = "";
  let source = "waitlist";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
    source = String(body?.source || "waitlist");
    if (body?.consent !== true) {
      return NextResponse.json({ detail: "consent_required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ detail: "invalid_email" }, { status: 400 });
  }
  const store = await getStore();
  const token = randomToken();
  await store.putOptin({
    email,
    source,
    consent_version: "v1-2026-10",
    created_at: new Date().toISOString(),
    confirmed_at: null,
    confirm_hash: hashToken(token),
  });
  const url = `${siteUrl()}/api/optin/confirm?token=${encodeURIComponent(token)}`;
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (key && from) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Confirma tu aviso — AstroEngine",
        text: `Confirma tu email para avisarte cuando abra el Mapa del Año:\n${url}`,
      }),
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
