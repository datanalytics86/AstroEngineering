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
  created_at: string;
  updated_at: string;
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

export interface Store {
  getCustomerByEmail(email: string): Promise<Customer | null>;
  upsertCustomer(email: string, locale: string): Promise<Customer>;
  insertChart(row: Omit<ChartRow, "created_at"> & { created_at?: string }): Promise<ChartRow>;
  getChart(id: string): Promise<ChartRow | null>;
  getChartByFingerprint(fp: string): Promise<ChartRow | null>;
  insertOrder(row: Omit<OrderRow, "created_at" | "updated_at"> & { created_at?: string }): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  updateOrder(id: string, patch: Partial<OrderRow>): Promise<OrderRow | null>;
  insertWebhookEvent(provider: string, eventId: string): Promise<boolean>;
  insertEntitlement(row: Omit<EntitlementRow, "id"> & { id?: string }): Promise<EntitlementRow>;
  listEntitlements(customerId: string): Promise<EntitlementRow[]>;
  revokeByOrder(orderId: string, at: string): Promise<number>;
  putMagicToken(row: MagicTokenRow): Promise<void>;
  getMagicToken(hash: string): Promise<MagicTokenRow | null>;
  markMagicUsed(hash: string, at: string): Promise<boolean>;
  putOptin(row: EmailOptinRow): Promise<void>;
  confirmOptin(hash: string, at: string): Promise<boolean>;
  getOptin(email: string): Promise<EmailOptinRow | null>;
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
