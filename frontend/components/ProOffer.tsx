"use client";

import { useEffect, useState } from "react";
import ActionButton from "@/components/ActionButton";
import Disclaimer from "@/components/Disclaimer";
import { useT } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/locales/es";
import { track } from "@/lib/analytics";
import type { BirthData } from "@/lib/types";
import type { Climate } from "@/lib/pro/climate";

export interface TeaserMonth {
  key: string;
  label: string;
  climate: Climate;
}

export default function ProOffer({
  birth,
  chartId,
  months,
  keyDateCount,
  currentHeadline,
}: {
  birth: BirthData | null;
  chartId?: string;
  months: TeaserMonth[];
  keyDateCount: number;
  currentHeadline?: string;
}) {
  const { t, lang } = useT();
  const [mode, setMode] = useState<"waitlist" | "live" | "dev">("waitlist");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track("paywall_viewed");
    let cancelled = false;
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d: { mode?: string; price?: string; checkoutOpen?: boolean }) => {
        if (cancelled) return;
        setMode(d.mode === "live" || d.mode === "dev" ? d.mode : "waitlist");
        if (d.price) setPrice(d.price);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function onWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "waitlist", consent: true }),
      });
      if (!res.ok) throw new Error("optin");
      setMsg(t("pro.waitlist.ok"));
      track("waitlist_joined");
    } catch {
      setError(t("pro.waitlist.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onCheckout() {
    if (!birth) return;
    setBusy(true);
    setError(null);
    track("checkout_started");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "year_map", birth, locale: lang, email }),
      });
      const data = (await res.json()) as { url?: string; detail?: string; mode?: string };
      if (res.status === 409) {
        setMode("waitlist");
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.detail || "checkout");
      window.location.href = data.url;
    } catch {
      setError(t("pay.checkout.error"));
      setBusy(false);
    }
  }

  const climateKey: Record<Climate, TranslationKeys> = {
    apretado: "pro.climate.apretado",
    abierto: "pro.climate.abierto",
    suave: "pro.climate.suave",
    parejo: "pro.climate.parejo",
  };
  const climateLabel = (c: Climate) => t(climateKey[c]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-2 leading-relaxed">{t("pro.offer.glance")}</p>
      {months.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("pro.offer.chips")}>
          {months.map((m) => (
            <li
              key={m.key}
              className="text-[11px] font-mono px-2 py-1 rounded-full border border-border bg-card text-ink-2"
            >
              {m.label} · {climateLabel(m.climate)}
            </li>
          ))}
        </ul>
      )}
      {currentHeadline && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-ink-3 mb-1">{t("pro.offer.this_month")}</p>
          <p className="text-sm text-ink leading-relaxed">{currentHeadline}</p>
        </div>
      )}
      <p className="text-sm text-ink">
        {t("pro.offer.dates", { n: String(keyDateCount), price: price || t("pro.price.fallback") })}
      </p>
      <p className="text-xs text-ink-3 blur-[3px] select-none" aria-hidden>
        03 · 11 · 18 · 22 · 29
      </p>
      <p className="text-sm font-medium text-ink">
        {price ? t("pro.offer.price_once", { price }) : t("pro.offer.price_loading")}
      </p>
      <p className="text-xs text-ink-3">{t("pro.offer.guarantee")}</p>
      <Disclaimer />

      {mode === "waitlist" ? (
        <form onSubmit={onWaitlist} className="space-y-3">
          <label className="block text-xs text-ink-2">
            {t("pro.waitlist.email")}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-border rounded-lg px-3 py-2.5 text-sm text-ink bg-card min-h-[44px]"
              placeholder={t("pay.intent.email_placeholder")}
            />
          </label>
          <p className="text-xs text-ink-3">{t("pro.waitlist.consent")}</p>
          <ActionButton type="submit" variant="primary" accent="indigo" className="min-h-[48px] w-full sm:w-auto" disabled={busy}>
            {busy ? t("pro.waitlist.sending") : t("pro.waitlist.cta")}
          </ActionButton>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <ActionButton
            variant="primary"
            accent="indigo"
            className="min-h-[48px]"
            disabled={busy || !birth}
            onClick={() => void onCheckout()}
          >
            {busy ? t("pay.checkout.redirecting") : t("pro.offer.cta", { price: price || "" })}
          </ActionButton>
        </div>
      )}
      {msg && (
        <p className="text-sm text-ok" role="status">
          {msg}
        </p>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="text-[11px] text-ink-3">{chartId ? t("pro.offer.restore") : null}</p>
    </div>
  );
}
