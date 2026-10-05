import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PENDING_COOKIE, SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const orderId = jar.get(PENDING_COOKIE)?.value;
  if (!orderId) return NextResponse.json({ status: "unknown" });
  const store = await getStore();
  const order = await store.getOrder(orderId);
  if (!order) return NextResponse.json({ status: "unknown" });
  if (order.status !== "paid" || !order.customer_id || !order.email) {
    return NextResponse.json({ status: order.status, orderId });
  }
  const token = encodeSession({
    customerId: order.customer_id,
    email: order.email,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  });
  const res = NextResponse.json({ status: "paid", orderId, chartId: order.chart_id, sku: order.sku });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
