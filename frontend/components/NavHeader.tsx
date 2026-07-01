"use client";

import { useT } from "@/lib/i18n";
import LangToggle from "./LangToggle";

export default function NavHeader() {
  const { t } = useT();

  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <span className="font-semibold text-slate-900 tracking-tight text-lg">AstroEngine</span>
        <span className="text-xs font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
      </a>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 text-sm text-slate-500">
          <a href="/" className="hover:text-blue-600 transition-colors">{t("nav.home")}</a>
          <a href="/nueva" className="hover:text-blue-600 transition-colors">{t("nav.new_chart")}</a>
          <a href="/geopolitica" className="hover:text-blue-600 transition-colors">{t("nav.geopolitics")}</a>
          <a href="/glosario" className="hover:text-blue-600 transition-colors">{t("nav.learn")}</a>
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}
