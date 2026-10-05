"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import BirthDataForm from "@/components/BirthDataForm";
import type { BirthData } from "@/lib/types";

export default function RedeemGiftPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("code");
    if (q) setCode(q);
  }, []);

  async function onBirth(birth: BirthData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gifts/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, locale: lang, birth }),
      });
      if (!res.ok) {
        setError(t("gift.redeem.error"));
        return;
      }
      router.push("/mis-mapas");
    } catch {
      setError(t("gift.redeem.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <h1 className="font-display text-3xl text-ink">{t("gift.redeem.title")}</h1>
      <p className="text-ink-2 leading-relaxed">{t("gift.redeem.lead")}</p>
      <label className="block text-sm text-ink-2">
        {t("gift.redeem.code")}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-ink font-mono"
        />
      </label>
      <label className="block text-sm text-ink-2">
        {t("gift.buyer_email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-ink"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className={busy ? "opacity-60 pointer-events-none" : ""}>
        <BirthDataForm onSubmit={(d) => void onBirth(d)} loading={busy} />
      </div>
    </article>
  );
}
