"use client";

import { useT } from "@/lib/i18n";

export default function Disclaimer({ className = "" }: { className?: string }) {
  const { t } = useT();
  return (
    <p className={`text-xs text-ink-3 leading-relaxed ${className}`.trim()} role="note">
      {t("legal.disclaimer")}
    </p>
  );
}
