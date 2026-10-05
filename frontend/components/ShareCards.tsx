"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { areasShareUrl, wordsShareUrl } from "@/lib/share";

export default function ShareCards({
  words = ["Amor", "Trabajo", "Crecimiento"],
  refCode,
}: {
  words?: [string, string, string] | string[];
  refCode?: string | null;
}) {
  const { t } = useT();
  const [copied, setCopied] = useState<"areas" | "words" | null>(null);
  const trio: [string, string, string] = [words[0] || "Amor", words[1] || "Trabajo", words[2] || "Crecimiento"];

  async function copy(kind: "areas" | "words") {
    const url = kind === "areas" ? areasShareUrl(refCode) : wordsShareUrl(trio, refCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      track("share_clicked", { kind, has_ref: Boolean(refCode) });
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="text-sm underline text-accent min-h-[44px]" onClick={() => void copy("areas")}>
        {copied === "areas" ? t("share.copied") : t("share.areas.copy")}
      </button>
      <button type="button" className="text-sm underline text-accent min-h-[44px]" onClick={() => void copy("words")}>
        {copied === "words" ? t("share.copied") : t("share.words.copy")}
      </button>
    </div>
  );
}
