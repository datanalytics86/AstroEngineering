"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import ActionButton from "@/components/ActionButton";
import { track } from "@/lib/analytics";

export default function GiftPage() {
  const { t, lang } = useT();
  const [email, setEmail] = useState("");
  const [recipient, setRecipient] = useState("");
  const [deliverAt, setDeliverAt] = useState("");
  const [price, setPrice] = useState("");
  const [mode, setMode] = useState<"waitlist" | "live" | "dev">("waitlist");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d: { mode?: string; price?: string }) => {
        setMode(d.mode === "live" || d.mode === "dev" ? d.mode : "waitlist");
        if (d.price) setPrice(d.price);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "waitlist") {
        const res = await fetch("/api/optin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "gift_waitlist", consent: true }),
        });
        if (!res.ok) throw new Error("optin");
        setMsg(t("pro.waitlist.ok"));
        track("waitlist_joined", { source: "gift" });
        return;
      }
      const ref = (() => {
        try {
          return sessionStorage.getItem("ae_ref") || undefined;
        } catch {
          return undefined;
        }
      })();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: "year_map_gift",
          email,
          locale: lang,
          gift_recipient_email: recipient,
          gift_deliver_at: deliverAt || undefined,
          ref,
        }),
      });
      const data = (await res.json()) as { url?: string; detail?: string };
      if (res.status === 409) {
        setMode("waitlist");
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.detail || "checkout");
      track("checkout_started", { sku: "year_map_gift" });
      window.location.href = data.url;
    } catch {
      setError(t("gift.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <h1 className="font-display text-3xl text-ink">{t("gift.title")}</h1>
      <p className="text-ink-2 leading-relaxed">{t("gift.lead")}</p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block text-sm text-ink-2">
          {t("gift.buyer_email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-2">
          {t("gift.recipient")}
          <input
            type="email"
            required={mode !== "waitlist"}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-2">
          {t("gift.deliver")}
          <input
            type="date"
            value={deliverAt}
            onChange={(e) => setDeliverAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-ink"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {msg && <p className="text-sm text-ink">{msg}</p>}
        <ActionButton type="submit" variant="primary" accent="blue" disabled={busy} className="min-h-[44px]">
          {mode === "waitlist"
            ? t("pro.waitlist.cta")
            : t("gift.cta", { price: price || t("pro.price.fallback") })}
        </ActionButton>
      </form>
    </article>
  );
}
