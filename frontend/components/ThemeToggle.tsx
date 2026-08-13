"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type Theme = "dark" | "light";

function readTheme(): Theme {
  try {
    return localStorage.getItem("astro_theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("astro_theme", theme);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const { t } = useT();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="focus-lab inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 rounded-[var(--r-sm)] border border-border text-ink-2 hover:text-ink hover:border-[var(--line-strong)] transition-colors duration-[var(--dur-2)] ease-instrument font-mono text-[11px] tracking-widest"
      aria-label={theme === "dark" ? t("theme.to_light") : t("theme.to_dark")}
      title={theme === "dark" ? t("theme.to_light") : t("theme.to_dark")}
    >
      {theme === "dark" ? "LT" : "DK"}
    </button>
  );
}
