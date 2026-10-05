"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import ActionButton from "@/components/ActionButton";

export default function MisMapasPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<{ sku: string; chart_id: string | null }[]>([]);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/pro/entitlements");
    const data = (await res.json()) as {
      email?: string;
      entitlements?: { sku: string; chart_id: string | null }[];
    };
    setSessionEmail(data.email || null);
    setItems(data.entitlements || []);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <h1 className="font-display text-3xl text-ink">{t("maps.title")}</h1>
      {sessionEmail ? (
        <p className="text-sm text-ink-2">{sessionEmail.replace(/^(.).*(@.*)$/, "$1***$2")}</p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/auth/magic-link", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
          }}
        >
          <p className="text-sm text-ink-2">{t("maps.empty")}</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-card text-ink min-h-[44px]"
          />
          <ActionButton type="submit" variant="primary" accent="indigo" className="min-h-[48px]">
            {t("maps.magic")}
          </ActionButton>
        </form>
      )}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={`${it.sku}-${it.chart_id}`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink">
            {it.sku}
          </li>
        ))}
      </ul>
      {sessionEmail && (
        <button
          type="button"
          className="text-sm text-ink-3 underline"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            setSessionEmail(null);
            setItems([]);
          }}
        >
          {t("maps.logout")}
        </button>
      )}
    </div>
  );
}
