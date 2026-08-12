"use client";

import { useState } from "react";
import type { TierMinus1Content } from "@/lib/types";
import { downloadTierMinus1Pdf } from "@/lib/download-preview-pdf";
import ActionButton from "@/components/ActionButton";
import { useT } from "@/lib/i18n";

interface DownloadPreviewPdfButtonProps {
  content: TierMinus1Content;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function DownloadPreviewPdfButton({
  content,
  variant = "primary",
  className = "",
}: DownloadPreviewPdfButtonProps) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await downloadTierMinus1Pdf(content);
    } catch {
      setError(t("chart.pdf.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-stretch sm:items-end gap-1.5">
      <ActionButton
        type="button"
        variant={variant}
        accent="blue"
        onClick={handleClick}
        disabled={busy}
        aria-label={t("chart.pdf.aria")}
        className={`min-h-[48px] ${className}`.trim()}
      >
        {busy ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {t("chart.pdf.downloading")}
          </>
        ) : (
          t("chart.pdf.download")
        )}
      </ActionButton>
      {error && (
        <p className="text-[11px] text-red-600 font-mono max-w-xs sm:text-right" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
