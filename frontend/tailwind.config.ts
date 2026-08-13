import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg)",
        elev: "var(--bg-elev)",
        card: "var(--card-solid)",
        border: "var(--line)",
        muted: "var(--bg-elev)",
        accent: "var(--accent)",
        ember: "var(--ember)",
        "accent-sky": "var(--accent)",
        "accent-hover": "var(--accent-soft)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "text-primary": "var(--ink)",
        "text-secondary": "var(--ink-2)",
        "text-hint": "var(--ink-3)",
        space: {
          bg: "var(--bg)",
          card: "var(--card-solid)",
          border: "var(--line)",
          muted: "var(--bg-elev)",
        },
        gold: "var(--ember)",
        fire: "var(--ember)",
        earth: "var(--ok)",
        air: "var(--accent-2)",
        water: "var(--accent)",
        harmony: "var(--ok)",
        tension: "var(--danger)",
        neutral: "var(--accent)",
        minor: "var(--ink-3)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        card: "var(--elev-1)",
        "card-md": "var(--elev-2)",
        wheel: "var(--elev-wheel)",
      },
      borderRadius: {
        lab: "11px 15px 13px 10px",
        "lab-lg": "22px 30px 24px 18px",
      },
      transitionTimingFunction: {
        orbital: "cubic-bezier(0.22, 1, 0.36, 1)",
        instrument: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
