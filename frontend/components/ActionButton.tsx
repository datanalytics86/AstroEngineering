"use client";

import type { ButtonHTMLAttributes } from "react";

type Accent = "blue" | "indigo" | "amber";
type Variant = "primary" | "secondary";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
}

// Clases completas (no interpoladas) por acento, para que Tailwind las detecte
// en el build estático — variantes: primaria (sólida) y secundaria (outline).
const PRIMARY: Record<Accent, string> = {
  blue: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
  amber: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
};

const SECONDARY: Record<Accent, string> = {
  blue: "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 focus-visible:ring-blue-500",
  indigo: "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 focus-visible:ring-indigo-500",
  amber: "border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 focus-visible:ring-amber-500",
};

/**
 * Botón de acción unificado (Bloque A). Una primaria sólida por página con el
 * acento del módulo; secundarias en outline slate con hover del acento de
 * destino. Incluye anillo de foco accesible (C5).
 */
export default function ActionButton({
  variant = "secondary",
  accent = "blue",
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  const base =
    "px-4 py-2 rounded-lg text-sm font-semibold transition-colors font-mono inline-flex items-center gap-1.5 justify-center " +
    "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
  const variantClasses = variant === "primary" ? PRIMARY[accent] : SECONDARY[accent];

  return (
    <button className={`${base} ${variantClasses} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
