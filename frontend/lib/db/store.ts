export type OrderStatus = "pending" | "paid" | "refunded" | "chargeback" | "expired";

export interface Customer {
  id: string;
  email: string;
  locale: string;
  marketing_opt_in: boolean;
  opt_in_at: string | null;
  created_at: string;
}

export interface ChartRow {
  id: string;
  customer_id: string | null;
  fingerprint: string;
  birth_enc: string;
  created_at: string;
}

export interface OrderRow {
  id: string;
  provider: string;
  provider_order_id: string | null;
  customer_id: string | null;
  sku: string;
  amount_minor: number;
  currency: string;
  status: OrderStatus;
  window_start: string;
  window_end: string;
  chart_id: string | null;
  email: string | null;
  locale: string;
  ph_id: string | null;
  ref: string | null;
  gift_recipient_email: string | null;
  gift_deliver_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftRow {
  id: string;
  code_hash: string;
  code_enc: string;
  code_prefix: string;
  sku: string;
  purchaser_customer_id: string;
  recipient_email: string;
  deliver_at: string;
  delivered_at: string | null;
  redeemed_at: string | null;
  redeemed_by_customer_id: string | null;
  order_id: string;
  locale: string;
}

export interface EntitlementRow {
  id: string;
  customer_id: string;
  chart_id: string | null;
  sku: string;
  valid_from: string;
  valid_to: string | null;
  source_order_id: string;
  revoked_at: string | null;
  fingerprint: string | null;
}

export interface MagicTokenRow {
  token_hash: string;
  email: string;
  expires_at: string;
  used_at: string | null;
}

export interface EmailOptinRow {
  email: string;
  source: string;
  consent_version: string;
  created_at: string;
  confirmed_at: string | null;
  confirm_hash: string | null;
}

type OrderInsert = Omit<
  OrderRow,
  "created_at" | "updated_at" | "ref" | "gift_recipient_email" | "gift_deliver_at"
> & {
  created_at?: string;
  ref?: string | null;
  gift_recipient_email?: string | null;
  gift_deliver_at?: string | null;
};

export interface Store {
  getCustomerByEmail(email: string): Promise<Customer | null>;
  getCustomerById(id: string): Promise<Customer | null>;
  upsertCustomer(email: string, locale: string): Promise<Customer>;
  insertChart(row: Omit<ChartRow, "created_at"> & { created_at?: string }): Promise<ChartRow>;
  getChart(id: string): Promise<ChartRow | null>;
  getChartByFingerprint(fp: string): Promise<ChartRow | null>;
  insertOrder(row: OrderInsert): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  updateOrder(id: string, patch: Partial<OrderRow>): Promise<OrderRow | null>;
  insertWebhookEvent(provider: string, eventId: string): Promise<boolean>;
  insertEntitlement(row: Omit<EntitlementRow, "id"> & { id?: string }): Promise<EntitlementRow>;
  listEntitlements(customerId: string): Promise<EntitlementRow[]>;
  listActiveEntitlements(at?: string): Promise<EntitlementRow[]>;
  revokeByOrder(orderId: string, at: string): Promise<number>;
  putMagicToken(row: MagicTokenRow): Promise<void>;
  getMagicToken(hash: string): Promise<MagicTokenRow | null>;
  markMagicUsed(hash: string, at: string): Promise<boolean>;
  putOptin(row: EmailOptinRow): Promise<void>;
  confirmOptin(hash: string, at: string): Promise<boolean>;
  getOptin(email: string): Promise<EmailOptinRow | null>;
  insertGift(row: GiftRow): Promise<GiftRow>;
  getGiftByCodeHash(hash: string): Promise<GiftRow | null>;
  getGiftByOrderId(orderId: string): Promise<GiftRow | null>;
  listDueGifts(at: string): Promise<GiftRow[]>;
  updateGift(id: string, patch: Partial<GiftRow>): Promise<GiftRow | null>;
}

let _store: Store | null = null;

export function setStore(store: Store): void {
  _store = store;
}

export function resetStore(): void {
  _store = null;
}

export async function getStore(): Promise<Store> {
  if (_store) return _store;
  const { memoryStore } = await import("./memory");
  _store = memoryStore();
  return _store;
}
