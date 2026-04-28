import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos nuevos (light theme)
        base:    "#FAFBFC",
        card:    "#FFFFFF",
        border:  "#E5E9F0",
        muted:   "#F1F5F9",
        accent:  "#2563EB",
        "accent-sky": "#0EA5E9",
        "accent-hover": "#EFF6FF",
        // Texto
        "text-primary":   "#0F172A",
        "text-secondary": "#64748B",
        "text-hint":      "#94A3B8",
        // Legado (para compatibilidad con código D3 interno)
        space: {
          bg:     "#FAFBFC",
          card:   "#FFFFFF",
          border: "#E5E9F0",
          muted:  "#F1F5F9",
        },
        gold: "#2563EB",
        // Elemento semántico
        fire:    "#EF4444",
        earth:   "#10B981",
        air:     "#F59E0B",
        water:   "#3B82F6",
        harmony: "#10B981",
        tension: "#EF4444",
        neutral: "#6366F1",
        minor:   "#A78BFA",
      },
      fontFamily: {
        mono:  ["JetBrains Mono", "monospace"],
        serif: ["Inter", "sans-serif"],   // mantenemos la clase pero apunta a Inter
        sans:  ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "card-gradient": "none",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
