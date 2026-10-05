import { billingProviderId, providerCanCharge } from "@/lib/pro/mode";
import { mockProvider } from "./mock";
import { stripeProvider } from "./stripe-adapter";
import type { BillingProvider, ProviderId } from "./provider";

export function getProvider(): BillingProvider {
  const id: ProviderId = billingProviderId();
  if (id === "stripe" && stripeProvider.enabled()) return stripeProvider;
  if (id === "lemonsqueezy") {
    // D1 pendiente: no hay adaptador activo.
    return mockProvider;
  }
  if (id === "mock") return mockProvider;
  if (!providerCanCharge(id)) return mockProvider;
  return mockProvider;
}

export type { BillingProvider, BillingEvent, ProviderId } from "./provider";
