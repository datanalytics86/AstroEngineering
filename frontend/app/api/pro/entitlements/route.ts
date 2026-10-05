import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { activeEntitlement } from "@/lib/billing/fulfill";
import { getStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ entitlements: [] });
  const store = await getStore();
  const list = await store.listEntitlements(session.customerId);
  return NextResponse.json({
    email: session.email,
    entitlements: list.filter((e) => activeEntitlement(e)).map((e) => ({
      sku: e.sku,
      chart_id: e.chart_id,
      fingerprint: e.fingerprint,
      window_start: e.valid_from,
      window_end: e.valid_to,
    })),
  });
}
