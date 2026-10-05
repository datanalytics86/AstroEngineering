import { randomUUID } from "node:crypto";
import { decryptJson, encryptJson, fingerprintBirth, hashToken, randomToken } from "@/lib/db/crypto";
import { getStore, type GiftRow } from "@/lib/db/store";
import { emailCopy, sendEmail } from "@/lib/email/send";
import { siteUrl } from "@/lib/site";

import type { BirthData } from "@/lib/types";

export function newGiftCode(): string {
  return randomToken(18);
}

export async function createGiftFromOrder(opts: {
  orderId: string;
  purchaserCustomerId: string;
  recipientEmail: string;
  deliverAt: string;
  locale: string;
}): Promise<{ gift: GiftRow; code: string }> {
  const store = await getStore();
  const code = newGiftCode();
  const gift = await store.insertGift({
    id: randomUUID(),
    code_hash: hashToken(code),
    code_enc: encryptJson({ code }),
    code_prefix: code.slice(0, 4),
    sku: "year_map",
    purchaser_customer_id: opts.purchaserCustomerId,
    recipient_email: opts.recipientEmail.trim().toLowerCase(),
    deliver_at: opts.deliverAt,
    delivered_at: null,
    redeemed_at: null,
    redeemed_by_customer_id: null,
    order_id: opts.orderId,
    locale: opts.locale === "en" ? "en" : "es",
  });
  return { gift, code };
}

export function redeemUrl(code: string): string {
  return `${siteUrl()}/regalo/canjear?code=${encodeURIComponent(code)}`;
}

export async function deliverGift(gift: GiftRow, code?: string): Promise<boolean> {
  const store = await getStore();
  if (gift.delivered_at) return true;
  let plaintext = code;
  if (!plaintext) {
    try {
      plaintext = decryptJson<{ code: string }>(gift.code_enc).code;
    } catch {
      return false;
    }
  }
  const copy = emailCopy(gift.locale);
  const sent = await sendEmail({
    to: gift.recipient_email,
    subject: copy.giftRecipientSubject,
    text: copy.giftRecipientText(redeemUrl(plaintext)),
  });
  if (!sent.sent && sent.skipped !== "email_unconfigured") return false;
  await store.updateGift(gift.id, { delivered_at: new Date().toISOString() });
  return true;
}

export async function deliverDueGifts(at: Date = new Date()): Promise<number> {
  const store = await getStore();
  const due = await store.listDueGifts(at.toISOString());
  let n = 0;
  for (const gift of due) {
    const ok = await deliverGift(gift);
    if (ok) n += 1;
  }
  return n;
}

export async function redeemGift(opts: {
  code: string;
  email: string;
  locale: "es" | "en";
  birth: BirthData;
}): Promise<{ customerId: string; chartId: string; email: string }> {
  const store = await getStore();
  const gift = await store.getGiftByCodeHash(hashToken(opts.code));
  if (!gift) throw new Error("gift_not_found");
  if (gift.redeemed_at) throw new Error("gift_used");
  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("invalid_email");
  const customer = await store.upsertCustomer(email, opts.locale);
  const now = new Date().toISOString();
  const chart = await store.insertChart({
    id: randomUUID(),
    customer_id: customer.id,
    fingerprint: fingerprintBirth(opts.birth),
    birth_enc: encryptJson(opts.birth),
  });
  await store.insertEntitlement({
    customer_id: customer.id,
    chart_id: chart.id,
    sku: "year_map",
    valid_from: now,
    valid_to: null,
    source_order_id: gift.order_id,
    revoked_at: null,
    fingerprint: chart.fingerprint,
  });
  await store.updateGift(gift.id, {
    redeemed_at: now,
    redeemed_by_customer_id: customer.id,
    delivered_at: gift.delivered_at ?? now,
  });
  return { customerId: customer.id, chartId: chart.id, email };
}

export async function sendMonthlyReminders(at: Date = new Date()): Promise<number> {
  const store = await getStore();
  const ents = await store.listActiveEntitlements(at.toISOString());
  const copyByLocale: Record<string, ReturnType<typeof emailCopy>> = {
    es: emailCopy("es"),
    en: emailCopy("en"),
  };
  const mapsUrl = `${siteUrl()}/mis-mapas`;
  const seen = new Set<string>();
  let n = 0;
  for (const e of ents) {
    if (seen.has(e.customer_id)) continue;
    seen.add(e.customer_id);
    const customer = await store.getCustomerById(e.customer_id);
    if (!customer?.email) continue;
    const copy = copyByLocale[customer.locale] || copyByLocale.es;
    const result = await sendEmail({
      to: customer.email,
      subject: copy.monthlySubject,
      text: copy.monthlyText(mapsUrl),
    });
    if (result.sent || result.skipped === "email_unconfigured") n += 1;
  }
  return n;
}
