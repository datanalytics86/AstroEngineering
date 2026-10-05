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
    const params = new URLSearchParams({
      orderId: i.orderId,
      next: i.successUrl,
    });
    if (i.ref) params.set("ref", i.ref);
    if (i.coupon) params.set("coupon", i.coupon);
    const url = `${origin}/api/billing/mock/pay?${params.toString()}`;
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
