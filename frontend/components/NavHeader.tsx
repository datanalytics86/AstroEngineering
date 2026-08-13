"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";

/** Active product nav only: natal core + glosario. */
const NAV_LINKS = [
  { href: "/", key: "nav.home" as const },
  { href: "/nueva", key: "nav.new_chart" as const },
  { href: "/glosario", key: "nav.learn" as const },
];

export default function NavHeader() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function linkClass(href: string, mobile = false): string {
    const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
    const base = mobile
      ? "block w-full px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors"
      : "text-sm transition-colors";
    return active
      ? `${base} text-accent ${mobile ? "bg-[var(--accent-soft)]" : "font-medium"}`
      : `${base} text-ink-2 hover:text-ink ${mobile ? "hover:bg-elev" : ""}`;
  }

  return (
    <header className="border-b border-border surface-glass sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-[44px]">
          <span className="font-display text-ink tracking-tight text-xl">AstroEngine</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 text-ink-2" aria-label={t("nav.home")}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={
                  (link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href))
                    ? "page"
                    : undefined
                }
                className={linkClass(link.href)}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          <ThemeToggle />
          <LangToggle />

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden focus-lab inline-flex items-center justify-center w-11 h-11 rounded-[var(--r-sm)] border border-border text-ink-2 hover:text-ink transition-colors"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.menu_close") : t("nav.menu_open")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="font-mono text-lg leading-none" aria-hidden>
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-border px-3 py-2 pb-3 space-y-1 bg-elev"
          aria-label={t("nav.menu_open")}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={linkClass(link.href, true)}
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
