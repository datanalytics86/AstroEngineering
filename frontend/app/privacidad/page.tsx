"use client";

import { useT } from "@/lib/i18n";

export default function PrivacidadPage() {
  const { t } = useT();
  return (
    <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14 space-y-6">
      <p className="text-xs uppercase tracking-widest text-blue-600">
        {t("privacy.kicker")}
      </p>
      <h1 className="font-semibold text-3xl text-slate-900 tracking-tight">
        {t("privacy.title")}
      </h1>
      <p className="text-slate-600 leading-relaxed">{t("privacy.p1")}</p>
      <p className="text-slate-600 leading-relaxed">{t("privacy.p2")}</p>
      <p className="text-slate-600 leading-relaxed">{t("privacy.p3")}</p>
      <p className="text-slate-600 leading-relaxed">{t("privacy.p4")}</p>
      <p>
        <a href="/nueva" className="text-blue-600 hover:underline font-medium">
          {t("privacy.back")}
        </a>
      </p>
    </article>
  );
}
