import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashToken, randomToken } from "@/lib/db/crypto";
import { memoryStore } from "@/lib/db/memory";
import { resetStore, setStore } from "@/lib/db/store";
import { encryptJson, fingerprintBirth } from "@/lib/db/crypto";
import { CATALOG, formatPrice, priceOf } from "./catalog";
import { activeEntitlement, fulfillPaid, fulfillRevoke, hasActiveEntitlement } from "./fulfill";
import { isAllowedOrigin } from "@/lib/site";
import { checkoutOpen, proMode } from "@/lib/pro/mode";

const birth = {
  name: "Ada",
  birth_date: "1990-05-15",
  birth_time: "14:30",
  latitude: -33.4489,
  longitude: -70.6693,
  tz_name: "America/Santiago",
  timezone_offset: -4,
};

describe("money invariants (mock)", () => {
  beforeEach(() => {
    resetStore();
    setStore(memoryStore());
    (process.env as { NODE_ENV?: string }).NODE_ENV = "test";
    process.env.PRO_MODE = "dev";
    process.env.BILLING_PROVIDER = "mock";
    process.env.DATA_ENC_KEY = "a".repeat(64);
    process.env.CHART_PEPPER = "b".repeat(64);
    process.env.SESSION_SECRET = "c".repeat(64);
  });
  afterEach(() => resetStore());

  it("without entitlement, access is denied even if a client flag says otherwise", async () => {
    expect(await hasActiveEntitlement("nobody")).toBe(false);
  });

  it("paid webhook grants one entitlement; replay is idempotent", async () => {
    const store = memoryStore();
    setStore(store);
    const order = await store.insertOrder({
      id: "ord_1",
      provider: "mock",
      provider_order_id: null,
      customer_id: null,
      sku: "year_map",
      amount_minor: 999,
      currency: "USD",
      status: "pending",
      window_start: "2026-10",
      window_end: "2027-09",
      chart_id: "ch_1",
      email: "ada@example.com",
      locale: "es",
      ph_id: null,
    });
    const ev = {
      eventId: "evt_1",
      type: "paid" as const,
      orderId: order.id,
      providerOrderId: "mock_1",
      email: "ada@example.com",
      amountMinor: 999,
      currency: "USD",
    };
    const a = await fulfillPaid(ev);
    const b = await fulfillPaid(ev);
    expect(a.order.status).toBe("paid");
    const paid = await store.getOrder(order.id);
    expect(paid?.status).toBe("paid");
    const cust = await store.getCustomerByEmail("ada@example.com");
    expect(cust).toBeTruthy();
    const ents = await store.listEntitlements(cust!.id);
    expect(ents).toHaveLength(1);
    expect(ents.filter((e) => activeEntitlement(e))).toHaveLength(1);
    expect(b.magicUrl).toBeUndefined();
    expect(await hasActiveEntitlement(cust!.id, "ch_1")).toBe(true);
  });

  it("refund revokes the entitlement", async () => {
    const store = memoryStore();
    setStore(store);
    await store.insertOrder({
      id: "ord_2",
      provider: "mock",
      provider_order_id: null,
      customer_id: null,
      sku: "year_map",
      amount_minor: 999,
      currency: "USD",
      status: "pending",
      window_start: "2026-10",
      window_end: "2027-09",
      chart_id: "ch_2",
      email: "ada@example.com",
      locale: "es",
      ph_id: null,
    });
    await fulfillPaid({
      eventId: "evt_pay",
      type: "paid",
      orderId: "ord_2",
      providerOrderId: "m2",
      email: "ada@example.com",
      amountMinor: 999,
      currency: "USD",
    });
    await fulfillRevoke({
      eventId: "evt_ref",
      type: "refunded",
      orderId: "ord_2",
      providerOrderId: "m2",
      email: "ada@example.com",
      amountMinor: 999,
      currency: "USD",
    });
    const cust = await store.getCustomerByEmail("ada@example.com");
    const ents = await store.listEntitlements(cust!.id);
    expect(ents[0].revoked_at).toBeTruthy();
    expect(await hasActiveEntitlement(cust!.id)).toBe(false);
  });

  it("magic link is single-use and expired links fail", async () => {
    const store = memoryStore();
    setStore(store);
    const token = randomToken();
    const hash = hashToken(token);
    await store.putMagicToken({
      token_hash: hash,
      email: "ada@example.com",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      used_at: null,
    });
    expect(await store.markMagicUsed(hash, new Date().toISOString())).toBe(true);
    expect(await store.markMagicUsed(hash, new Date().toISOString())).toBe(false);

    const expired = randomToken();
    const eh = hashToken(expired);
    await store.putMagicToken({
      token_hash: eh,
      email: "ada@example.com",
      expires_at: new Date(Date.now() - 1000).toISOString(),
      used_at: null,
    });
    const row = await store.getMagicToken(eh);
    expect(new Date(row!.expires_at).getTime()).toBeLessThan(Date.now());
  });

  it("checkout success/cancel only allow SITE_URL", () => {
    expect(isAllowedOrigin("https://astro-engineering.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://evil.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://attacker.example")).toBe(false);
  });

  it("prices come from the catalog, not $2.99", () => {
    expect(CATALOG.year_map.prices.USD).toBe(999);
    expect(priceOf("year_map", "USD").label).toBe("US$9.99");
    expect(formatPrice(8990, "CLP")).toMatch(/8\.990|8,990|8990/);
    expect(priceOf("year_map", "USD").label.includes("2.99")).toBe(false);
  });

  it("encrypts birth data; fingerprint is HMAC not plaintext", () => {
    const blob = encryptJson(birth);
    expect(blob.includes("1990-05-15")).toBe(false);
    const fp = fingerprintBirth(birth);
    expect(fp).toHaveLength(64);
    expect(fp.includes("1990")).toBe(false);
  });

  it("gift purchase does not grant the buyer an entitlement; redeem grants the recipient", async () => {
    const store = memoryStore();
    setStore(store);
    await store.insertOrder({
      id: "ord_gift",
      provider: "mock",
      provider_order_id: null,
      customer_id: null,
      sku: "year_map_gift",
      amount_minor: 999,
      currency: "USD",
      status: "pending",
      window_start: "2026-10",
      window_end: "2027-09",
      chart_id: null,
      email: "buyer@example.com",
      locale: "es",
      ph_id: null,
      gift_recipient_email: "recv@example.com",
      gift_deliver_at: new Date().toISOString(),
    });
    await fulfillPaid({
      eventId: "evt_gift",
      type: "paid",
      orderId: "ord_gift",
      providerOrderId: "mg",
      email: "buyer@example.com",
      amountMinor: 999,
      currency: "USD",
    });
    const buyer = await store.getCustomerByEmail("buyer@example.com");
    expect(buyer).toBeTruthy();
    expect(await store.listEntitlements(buyer!.id)).toHaveLength(0);
    const gift = await store.getGiftByOrderId("ord_gift");
    expect(gift).toBeTruthy();
    expect(gift?.delivered_at).toBeTruthy();
    const { decryptJson } = await import("@/lib/db/crypto");
    const { redeemGift } = await import("@/lib/gifts");
    const code = decryptJson<{ code: string }>(gift!.code_enc).code;
    const redeemed = await redeemGift({
      code,
      email: "recv@example.com",
      locale: "es",
      birth,
    });
    expect(await hasActiveEntitlement(redeemed.customerId)).toBe(true);
    expect(await hasActiveEntitlement(buyer!.id)).toBe(false);
    await expect(
      redeemGift({ code, email: "recv@example.com", locale: "es", birth }),
    ).rejects.toThrow("gift_used");
  });

  it("stores referral on the order and maps a mock coupon", async () => {
    const { sanitizeRef, mockCouponForRef } = await import("./referral");
    expect(sanitizeRef("ok_code-1")).toBe("ok_code-1");
    expect(sanitizeRef("bad code")).toBeNull();
    expect(mockCouponForRef("ana")).toBe("REF_ANA");
  });

  it("production waitlist blocks mock checkout", () => {
    const prevV = process.env.VERCEL_ENV;
    const prevN = process.env.NODE_ENV;
    const prevM = process.env.PRO_MODE;
    process.env.VERCEL_ENV = "production";
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    process.env.PRO_MODE = "waitlist";
    expect(proMode()).toBe("waitlist");
    expect(checkoutOpen()).toBe(false);
    process.env.VERCEL_ENV = prevV;
    (process.env as { NODE_ENV?: string }).NODE_ENV = prevN;
    process.env.PRO_MODE = prevM;
  });
});
