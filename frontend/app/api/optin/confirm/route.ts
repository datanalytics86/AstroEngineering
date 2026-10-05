import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import { siteUrl } from "@/lib/site";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const store = await getStore();
  const ok = token ? await store.confirmOptin(hashToken(token), new Date().toISOString()) : false;
  return NextResponse.redirect(`${siteUrl()}/pro?optin=${ok ? "ok" : "invalid"}`);
}
