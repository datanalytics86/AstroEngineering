"use client";

import { useT } from "@/lib/i18n";
import { SOURCE_CODE_URL } from "@/lib/site";

export default function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="border-t border-border mt-16 px-6 py-6 text-center text-xs text-ink-3 space-y-2">
      <p>{t("footer.tagline")}</p>
      <p className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        <a href="/privacidad" className="underline decoration-[var(--line)] hover:text-accent">
          {t("footer.privacy")}
        </a>
        <a href="/terminos" className="underline decoration-[var(--line)] hover:text-accent">
          {t("footer.terms")}
        </a>
        <a href="/reembolsos" className="underline decoration-[var(--line)] hover:text-accent">
          {t("footer.refunds")}
        </a>
        <a href="/contacto" className="underline decoration-[var(--line)] hover:text-accent">
          {t("footer.contact")}
        </a>
        <a
          href={SOURCE_CODE_URL}
          className="underline decoration-[var(--line)] hover:text-accent"
          rel="noopener noreferrer"
        >
          {t("footer.source")}
        </a>
      </p>
    </footer>
  );
}
