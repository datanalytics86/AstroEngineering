import { NextRequest, NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { hashToken } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const fail = NextResponse.redirect(`${siteUrl()}/mis-mapas?auth=invalid`);
  if (!token) return fail;
  const store = await getStore();
  const row = await store.getMagicToken(hashToken(token));
  if (!row) return fail;
  if (row.used_at) return fail;
  if (new Date(row.expires_at).getTime() < Date.now()) return fail;
  const used = await store.markMagicUsed(hashToken(token), new Date().toISOString());
  if (!used) return fail;
  const customer = await store.upsertCustomer(row.email, "es");
  const res = NextResponse.redirect(`${siteUrl()}/mis-mapas`);
  res.cookies.set(
    SESSION_COOKIE,
    encodeSession({
      customerId: customer.id,
      email: customer.email,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }),
    sessionCookieOptions(),
  );
  return res;
}
