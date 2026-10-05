import { NextRequest, NextResponse } from "next/server";
import { deliverDueGifts, sendMonthlyReminders } from "@/lib/gifts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  const now = new Date();
  const gifts = await deliverDueGifts(now);
  const monthly = now.getUTCDate() === 1 ? await sendMonthlyReminders(now) : 0;
  return NextResponse.json({ ok: true, gifts, monthly, day: now.getUTCDate() });
}

export const POST = GET;
