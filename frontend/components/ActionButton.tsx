"use client";

import type { ButtonHTMLAttributes } from "react";

type Accent = "blue" | "indigo" | "amber";
type Variant = "primary" | "secondary";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
}

const PRIMARY: Record<Accent, string> = {
  blue: "bg-[var(--ember)] text-[var(--bg)] hover:brightness-110 focus-visible:ring-[var(--focus)]",
  indigo: "bg-[var(--accent)] text-[var(--bg)] hover:brightness-110 focus-visible:ring-[var(--focus)]",
  amber: "bg-[var(--accent-2)] text-[var(--bg)] hover:brightness-110 focus-visible:ring-[var(--focus)]",
};

const SECONDARY: Record<Accent, string> = {
  blue: "border border-border text-ink-2 hover:border-[var(--ember)] hover:text-ink focus-visible:ring-[var(--focus)]",
  indigo: "border border-border text-ink-2 hover:border-[var(--accent)] hover:text-ink focus-visible:ring-[var(--focus)]",
  amber: "border border-border text-ink-2 hover:border-[var(--accent-2)] hover:text-ink focus-visible:ring-[var(--focus)]",
};

export default function ActionButton({
  variant = "secondary",
  accent = "blue",
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  const base =
    "px-4 py-2 rounded-[var(--r-md)] text-sm font-medium transition-all duration-[var(--dur-2)] ease-instrument font-mono inline-flex items-center gap-1.5 justify-center " +
    "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";
  const variantClasses = variant === "primary" ? PRIMARY[accent] : SECONDARY[accent];

  return (
    <button className={`${base} ${variantClasses} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
