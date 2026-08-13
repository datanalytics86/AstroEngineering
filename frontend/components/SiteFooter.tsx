"use client";

import { useT } from "@/lib/i18n";

export default function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="border-t border-border mt-16 px-6 py-6 text-center text-xs text-ink-3 space-y-2">
      <p>{t("footer.tagline")}</p>
      <p>
        <a href="/privacidad" className="underline decoration-[var(--line)] hover:text-accent">
          {t("footer.privacy")}
        </a>
      </p>
    </footer>
  );
}
