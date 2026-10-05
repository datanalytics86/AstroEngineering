"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function ShareLanding({ kind }: { kind: "areas" | "words" }) {
  const { t } = useT();
  const title = kind === "areas" ? t("share.areas.title") : t("share.words.title");
  const body = kind === "areas" ? t("share.areas.body") : t("share.words.body");
  return (
    <article className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <p className="text-xs uppercase tracking-widest text-accent">AstroEngine</p>
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="text-ink-2 leading-relaxed">{body}</p>
      <Link
        href="/nueva"
        className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--ember)] px-4 text-[var(--bg)]"
      >
        {t("share.cta")}
      </Link>
    </article>
  );
}
