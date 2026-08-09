"use client";

/**
 * Archived product surface. Full calendar UI is not part of the active MVP.
 * Backend / corpus remain in the repo for a later sprint.
 */

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import ActionButton from "@/components/ActionButton";

export default function CalendarioArchivedPage() {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
          {t("archive.badge")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {t("archive.calendar.title")}
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t("archive.calendar.body")}
        </p>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t("archive.hint")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <ActionButton
            variant="primary"
            accent="blue"
            className="w-full sm:w-auto min-h-[44px]"
            onClick={() => router.push("/nueva")}
          >
            {t("archive.cta.primary")}
          </ActionButton>
          <ActionButton
            variant="secondary"
            accent="blue"
            className="w-full sm:w-auto min-h-[44px]"
            onClick={() => router.push("/")}
          >
            {t("archive.cta.home")}
          </ActionButton>
        </div>
        <button
          type="button"
          onClick={() => router.push("/glosario")}
          className="text-xs font-mono text-slate-400 hover:text-blue-600 transition-colors min-h-[44px]"
        >
          {t("archive.cta.glossary")}
        </button>
      </div>
    </div>
  );
}
