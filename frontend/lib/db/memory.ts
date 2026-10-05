import { randomUUID } from "node:crypto";
import type {
  ChartRow,
  Customer,
  EmailOptinRow,
  EntitlementRow,
  MagicTokenRow,
  OrderRow,
  Store,
} from "./store";

export function memoryStore(): Store {
  const customers = new Map<string, Customer>();
  const charts = new Map<string, ChartRow>();
  const orders = new Map<string, OrderRow>();
  const entitlements = new Map<string, EntitlementRow>();
  const webhooks = new Set<string>();
  const magics = new Map<string, MagicTokenRow>();
  const optins = new Map<string, EmailOptinRow>();

  return {
    async getCustomerByEmail(email) {
      const key = email.trim().toLowerCase();
      return customers.get(key) ?? null;
    },
    async upsertCustomer(email, locale) {
      const key = email.trim().toLowerCase();
      const existing = customers.get(key);
      if (existing) return existing;
      const row: Customer = {
        id: randomUUID(),
        email: key,
        locale,
        marketing_opt_in: false,
        opt_in_at: null,
        created_at: new Date().toISOString(),
      };
      customers.set(key, row);
      return row;
    },
    async insertChart(row) {
      const full: ChartRow = { created_at: new Date().toISOString(), ...row };
      charts.set(full.id, full);
      return full;
    },
    async getChart(id) {
      return charts.get(id) ?? null;
    },
    async getChartByFingerprint(fp) {
      return [...charts.values()].find((c) => c.fingerprint === fp) ?? null;
    },
    async insertOrder(row) {
      const now = new Date().toISOString();
      const full: OrderRow = { created_at: now, updated_at: now, ...row };
      orders.set(full.id, full);
      return full;
    },
    async getOrder(id) {
      return orders.get(id) ?? null;
    },
    async updateOrder(id, patch) {
      const cur = orders.get(id);
      if (!cur) return null;
      const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
      orders.set(id, next);
      return next;
    },
    async insertWebhookEvent(provider, eventId) {
      const k = `${provider}:${eventId}`;
      if (webhooks.has(k)) return false;
      webhooks.add(k);
      return true;
    },
    async insertEntitlement(row) {
      const full: EntitlementRow = { id: row.id ?? randomUUID(), ...row };
      entitlements.set(full.id, full);
      return full;
    },
    async listEntitlements(customerId) {
      return [...entitlements.values()].filter((e) => e.customer_id === customerId);
    },
    async revokeByOrder(orderId, at) {
      let n = 0;
      for (const e of entitlements.values()) {
        if (e.source_order_id === orderId && !e.revoked_at) {
          e.revoked_at = at;
          n += 1;
        }
      }
      return n;
    },
    async putMagicToken(row) {
      magics.set(row.token_hash, row);
    },
    async getMagicToken(hash) {
      return magics.get(hash) ?? null;
    },
    async markMagicUsed(hash, at) {
      const row = magics.get(hash);
      if (!row || row.used_at) return false;
      row.used_at = at;
      return true;
    },
    async putOptin(row) {
      optins.set(row.email, row);
    },
    async confirmOptin(hash, at) {
      for (const row of optins.values()) {
        if (row.confirm_hash === hash && !row.confirmed_at) {
          row.confirmed_at = at;
          return true;
        }
      }
      return false;
    },
    async getOptin(email) {
      return optins.get(email.trim().toLowerCase()) ?? null;
    },
  };
}
