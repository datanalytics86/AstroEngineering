import { randomUUID } from "node:crypto";
import { hashToken, randomToken } from "@/lib/db/crypto";
import { getStore } from "@/lib/db/store";
import type { BillingEvent } from "./provider";
import type { EntitlementRow, OrderRow } from "@/lib/db/store";

export function activeEntitlement(e: EntitlementRow, at: Date = new Date()): boolean {
  if (e.revoked_at) return false;
  if (new Date(e.valid_from).getTime() > at.getTime()) return false;
  if (e.valid_to && new Date(e.valid_to).getTime() < at.getTime()) return false;
  return true;
}

export async function fulfillPaid(
  event: BillingEvent,
  provider = "mock",
): Promise<{ order: OrderRow; magicUrl?: string }> {
  const store = await getStore();
  const first = await store.insertWebhookEvent(provider, event.eventId);
  const order = await store.getOrder(event.orderId);
  if (!order) throw new Error("order_missing");
  if (!first) return { order };

  const email = (event.email || order.email || "").trim().toLowerCase();
  if (!email) throw new Error("email_missing");
  const customer = await store.upsertCustomer(email, order.locale || "es");
  const now = new Date().toISOString();
  const updated = await store.updateOrder(order.id, {
    status: "paid",
    customer_id: customer.id,
    provider_order_id: event.providerOrderId,
    email,
  });
  const chart = order.chart_id ? await store.getChart(order.chart_id) : null;
  await store.insertEntitlement({
    customer_id: customer.id,
    chart_id: order.chart_id,
    sku: order.sku,
    valid_from: now,
    valid_to: null,
    source_order_id: order.id,
    revoked_at: null,
    fingerprint: chart?.fingerprint ?? null,
  });
  const token = randomToken();
  await store.putMagicToken({
    token_hash: hashToken(token),
    email,
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    used_at: null,
  });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { order: updated ?? order, magicUrl: `${base}/api/auth/verify?token=${encodeURIComponent(token)}` };
}

export async function fulfillRevoke(event: BillingEvent, provider = "mock"): Promise<void> {
  const store = await getStore();
  const first = await store.insertWebhookEvent(provider, event.eventId);
  if (!first) return;
  const order = await store.getOrder(event.orderId);
  if (!order) return;
  const status = event.type === "chargeback" ? "chargeback" : "refunded";
  await store.updateOrder(order.id, { status });
  await store.revokeByOrder(order.id, new Date().toISOString());
}

export function newIds() {
  return { orderId: randomUUID(), chartId: randomUUID() };
}

export async function hasActiveEntitlement(customerId: string, chartId?: string | null): Promise<boolean> {
  const store = await getStore();
  const list = await store.listEntitlements(customerId);
  return list.some((e) => activeEntitlement(e) && (!chartId || e.chart_id === chartId || e.chart_id == null));
}
