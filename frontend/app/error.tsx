"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/observability";
import { useT } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    captureException(error, {
      source: "error.tsx",
      digest: error.digest ?? "",
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="font-semibold text-2xl text-slate-900 mb-3">{t("error.title")}</h1>
        <p className="text-slate-500 text-sm mb-2">{error.message}</p>
        {error.digest && (
          <p className="text-slate-400 text-xs mb-6">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("error.retry")}
          </button>
          <a
            href="/"
            className="border border-border text-slate-500 px-5 py-2.5 min-h-[44px] rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {t("error.home")}
          </a>
        </div>
      </div>
    </div>
  );
}
