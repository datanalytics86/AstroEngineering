"use client";

import { useT } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <div className="flex items-center gap-1 text-xs font-mono border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setLang("es")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "es"
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-700"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "en"
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}
