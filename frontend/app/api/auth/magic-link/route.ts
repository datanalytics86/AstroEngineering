import { NextRequest, NextResponse } from "next/server";
import { hashToken, randomToken } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
  } catch {
    /* always 204 */
  }
  if (email && email.includes("@") && email.includes(".")) {
    const store = await getStore();
    const token = randomToken();
    await store.putMagicToken({
      token_hash: hashToken(token),
      email,
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      used_at: null,
    });
    const url = `${siteUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
    await sendMagicEmail(email, url);
  }
  return new NextResponse(null, { status: 204 });
}

async function sendMagicEmail(to: string, url: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info("magic_link.dev", to.replace(/^(.).*(@.*)$/, "$1***$2"), "sent");
    }
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Tu acceso a AstroEngine",
      text: `Entra a tus mapas: ${url}\nEste enlace caduca en 20 minutos y es de un solo uso.`,
    }),
  }).catch(() => undefined);
}
