import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { hasActiveEntitlement } from "@/lib/billing/fulfill";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  const chartId = req.nextUrl.searchParams.get("chart_id");
  const ok = await hasActiveEntitlement(session.customerId, chartId);
  if (!ok) return NextResponse.json({ detail: "forbidden" }, { status: 403 });
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AstroEngine//Year Map//ES",
    "CALSCALE:GREGORIAN",
    "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mapa-del-ano.ics"',
    },
  });
}
