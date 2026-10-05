/** PRO_MODE: live | waitlist | dev. En producción, live exige D1 + proveedor real. */

export type ProMode = "live" | "waitlist" | "dev";
export type ProviderId = "stripe" | "lemonsqueezy" | "mercadopago" | "mock";

export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function billingProviderId(): ProviderId {
  const raw = (process.env.BILLING_PROVIDER || "").trim().toLowerCase();
  if (raw === "stripe" || raw === "lemonsqueezy" || raw === "mercadopago" || raw === "mock") {
    return raw;
  }
  return "mock";
}

/**
 * Lemon Squeezy no se activa sin D1 escrito (LEMONSQUEEZY_ENABLED=true).
 * Stripe queda como adaptador portado, apagado si no hay clave.
 */
export function providerCanCharge(id: ProviderId): boolean {
  if (id === "mock") return !isProductionRuntime();
  if (id === "lemonsqueezy") {
    return process.env.LEMONSQUEEZY_ENABLED === "true" && Boolean(process.env.LEMONSQUEEZY_API_KEY?.trim());
  }
  if (id === "stripe") return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  if (id === "mercadopago") return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
  return false;
}

export function proMode(): ProMode {
  const raw = (process.env.PRO_MODE || "").trim().toLowerCase();
  if (raw === "dev") {
    if (isProductionRuntime()) return "waitlist";
    return "dev";
  }
  if (raw === "live") {
    const id = billingProviderId();
    if (id === "mock" || !providerCanCharge(id) || id === "lemonsqueezy" && process.env.LEMONSQUEEZY_ENABLED !== "true") {
      return "waitlist";
    }
    return "live";
  }
  if (raw === "waitlist") return "waitlist";
  return isProductionRuntime() ? "waitlist" : "dev";
}

export function checkoutOpen(): boolean {
  const mode = proMode();
  if (mode === "waitlist") return false;
  if (mode === "dev") return true;
  return providerCanCharge(billingProviderId());
}
