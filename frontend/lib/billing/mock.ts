import type { BillingEvent, BillingProvider } from "./provider";
import { isProductionRuntime } from "@/lib/pro/mode";
import { siteUrl } from "@/lib/site";

export const mockProvider: BillingProvider = {
  id: "mock",
  enabled() {
    return !isProductionRuntime();
  },
  async createCheckout(i) {
    const origin = siteUrl();
    const url = `${origin}/api/billing/mock/pay?orderId=${encodeURIComponent(i.orderId)}&next=${encodeURIComponent(i.successUrl)}`;
    return { url };
  },
  async verifyAndParseWebhook(req) {
    const secret = process.env.MOCK_WEBHOOK_SECRET || "mock-webhook";
    const sig = req.headers.get("x-mock-signature");
    if (sig !== secret) return null;
    const body = (await req.json()) as BillingEvent;
    if (!body?.eventId || !body.orderId || !body.type) return null;
    return body;
  },
};
