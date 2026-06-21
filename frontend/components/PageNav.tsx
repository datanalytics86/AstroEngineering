"use client";

import { useRouter } from "next/navigation";

interface NavButton {
  label: string;
  href: string;
  variant?: "default" | "primary";
}

interface PageNavProps {
  buttons: NavButton[];
}

export default function PageNav({ buttons }: PageNavProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.href + btn.label}
          onClick={() => router.push(btn.href)}
          className={
            btn.variant === "primary"
              ? "bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors font-mono"
              : "border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-300 hover:text-blue-600 transition-colors font-mono"
          }
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
