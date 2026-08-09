"use client";

import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import LangToggle from "./LangToggle";

/** Active product nav only: natal core + glosario. */
const NAV_LINKS = [
  { href: "/", key: "nav.home" as const },
  { href: "/nueva", key: "nav.new_chart" as const },
  { href: "/glosario", key: "nav.learn" as const },
];

export default function NavHeader() {
  const { t } = useT();
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <span className="font-semibold text-slate-900 tracking-tight text-lg">AstroEngine</span>
        <span className="text-xs font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
      </a>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 text-sm text-slate-500">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-blue-600 font-medium transition-colors"
                    : "hover:text-blue-600 transition-colors"
                }
              >
                {t(link.key)}
              </a>
            );
          })}
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}
