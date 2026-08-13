"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 text-blue-200">✦</div>
        <h1 className="font-semibold text-2xl sm:text-3xl text-slate-900 mb-3 leading-snug">
          {t("notfound.title")}
        </h1>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {t("notfound.body")}
        </p>
        <Link
          href="/nueva"
          className="inline-block bg-blue-600 text-white px-6 py-3 min-h-[48px] rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("notfound.cta")}
        </Link>
      </div>
    </div>
  );
}
