"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import ShareCards from "@/components/ShareCards";

export default function GraciasPage() {
  const { t } = useT();
  const [state, setState] = useState<"wait" | "ready" | "timeout">("wait");

  useEffect(() => {
    let n = 0;
    const tick = async () => {
      n += 1;
      try {
        const res = await fetch("/api/pro/order-status");
        const data = (await res.json()) as { status?: string };
        if (data.status === "paid") {
          setState("ready");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (n >= 15) setState("timeout");
      else window.setTimeout(() => void tick(), 2000);
    };
    void tick();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 space-y-4">
      <h1 className="font-display text-3xl text-ink">{t("pro.gracias.title")}</h1>
      {state === "wait" && <p className="text-ink-2">{t("pro.gracias.wait")}</p>}
      {state === "timeout" && <p className="text-ink-2">{t("pro.gracias.timeout")}</p>}
      {state === "ready" && (
        <div className="space-y-4">
          <p className="text-ink">
            {t("pro.gracias.ready")}{" "}
            <a className="text-accent underline" href="/mis-mapas">
              {t("nav.maps")}
            </a>
          </p>
          <p className="text-sm text-ink-2">{t("pro.gracias.share")}</p>
          <ShareCards />
          <a className="text-accent underline text-sm" href="/regalo">
            {t("pro.gracias.gift")}
          </a>
          <a className="block text-sm text-ink-3 underline" href="/api/pro/year-map.pdf">
            PDF
          </a>
        </div>
      )}
    </div>
  );
}
