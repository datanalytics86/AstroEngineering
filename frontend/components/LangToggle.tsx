"use client";

import { useT } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <div className="flex items-center gap-1 text-xs font-mono border border-border rounded-[var(--r-sm)] overflow-hidden">
      <button
        onClick={() => setLang("es")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "es"
            ? "bg-[var(--ember)] text-[var(--bg)]"
            : "text-ink-3 hover:text-ink"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "en"
            ? "bg-[var(--ember)] text-[var(--bg)]"
            : "text-ink-3 hover:text-ink"
        }`}
      >
        EN
      </button>
    </div>
  );
}
