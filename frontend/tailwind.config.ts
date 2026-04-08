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
        space: {
          bg:      "#0A0E1A",
          card:    "#111827",
          border:  "#1F2937",
          muted:   "#374151",
        },
        gold:    "#C9A84C",
        fire:    "#DC2626",
        earth:   "#16A34A",
        air:     "#EAB308",
        water:   "#2563EB",
        harmony: "#22C55E",
        tension: "#EF4444",
        neutral: "#60A5FA",
      },
      fontFamily: {
        mono:  ["JetBrains Mono", "monospace"],
        serif: ["Playfair Display", "serif"],
        sans:  ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "card-gradient": "linear-gradient(135deg, rgba(30,27,75,0.6), rgba(17,24,39,0.9))",
      },
    },
  },
  plugins: [],
};

export default config;
