import { NextRequest, NextResponse } from "next/server";
import { fulfillPaid } from "@/lib/billing/fulfill";
import { getStore } from "@/lib/db/store";
import { checkoutOpen, proMode } from "@/lib/pro/mode";
import { isAllowedOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Solo PRO_MODE=dev. Simula el pago y redirige a success. */
export async function GET(req: NextRequest) {
  if (proMode() !== "dev" || !checkoutOpen()) {
    return NextResponse.json({ detail: "forbidden" }, { status: 403 });
  }
  const orderId = req.nextUrl.searchParams.get("orderId") || "";
  const next = req.nextUrl.searchParams.get("next") || "/pro/gracias";
  if (!orderId) return NextResponse.json({ detail: "order" }, { status: 400 });
  if (next.startsWith("http") && !isAllowedOrigin(new URL(next).origin)) {
    return NextResponse.json({ detail: "origin_forbidden" }, { status: 400 });
  }
  const store = await getStore();
  const order = await store.getOrder(orderId);
  if (!order) return NextResponse.json({ detail: "missing" }, { status: 404 });
  await fulfillPaid(
    {
      eventId: `mockpay_${orderId}`,
      type: "paid",
      orderId,
      providerOrderId: `mock_${orderId}`,
      email: order.email || "dev@localhost",
      amountMinor: order.amount_minor,
      currency: order.currency,
    },
    "mock",
  );
  return NextResponse.redirect(next.startsWith("http") ? next : new URL(next, req.url));
}
