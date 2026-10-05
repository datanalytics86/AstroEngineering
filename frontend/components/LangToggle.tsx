"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/locale-path";

export default function LangToggle() {
  const { lang, setLang } = useT();
  const router = useRouter();

  function go(next: "es" | "en") {
    setLang(next);
    if (typeof window === "undefined") return;
    const { pathname } = stripLocalePrefix(window.location.pathname);
    const dest = `${withLocalePrefix(pathname, next)}${window.location.search}`;
    if (dest !== `${window.location.pathname}${window.location.search}`) {
      router.push(dest);
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs font-mono border border-border rounded-[var(--r-sm)] overflow-hidden">
      <button
        onClick={() => go("es")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "es"
            ? "bg-[var(--ember)] text-[var(--bg)]"
            : "text-ink-3 hover:text-ink"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => go("en")}
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
