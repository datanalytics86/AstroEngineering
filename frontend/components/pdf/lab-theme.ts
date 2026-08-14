import type { YearClimate } from "@/lib/year-map";

/** Celestial Laboratory — print tokens. Ivory #F4EFE4 is the paper ground. */
export const Lab = {
  paper: "#F4EFE4",
  navy: "#142033",
  ivory: "#F4EFE4",
  ink: "#142033",
  slate: "#3D4A5C",
  copper: "#6B4423",
  rule: "#D4CBB8",
  wash: "#EFE8D8",
  hair: "#C4B8A2",
} as const;

export const ClimateInk: Record<YearClimate, string> = {
  apretado: "#9A3412",
  abierto: "#065F46",
  suave: "#1E3A5F",
};
export const ClimateBg: Record<YearClimate, string> = {
  apretado: "#FFF7ED",
  abierto: "#ECFDF5",
  suave: "#EEF4F8",
};
export const ClimateBar: Record<YearClimate, string> = {
  apretado: "#C2410C",
  abierto: "#0F766E",
  suave: "#1E3A5F",
};

export const TopicInk: Record<string, string> = {
  amor: "#9A3412",
  dinero: "#065F46",
  trabajo: "#1E3A5F",
  salud: "#6B4423",
  familia: "#3D4A5C",
  crecimiento: "#142033",
};

export const Fonts = {
  serif: "LabSerif",
  sans: "LabSans",
  mono: "LabMono",
} as const;

/** 4-step rhythm. Use only these — no one-off margins. */
export const Space = {
  1: 3,
  2: 6,
  3: 8,
  4: 12,
  5: 16,
  6: 24,
  7: 32,
  pageX: 38,
  pageTop: 40,
  pageBottom: 30,
  mast: 20,
  content: 519,
} as const;

/**
 * Type roles. One size per job.
 * Display = Baskerville. Body = Plex Sans. Data = Plex Mono.
 */
export const Type = {
  display: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 1.06, color: Lab.ink },
  title: { fontFamily: Fonts.serif, fontSize: 15, lineHeight: 1.2, color: Lab.ink },
  lead: { fontFamily: Fonts.serif, fontStyle: "italic" as const, fontSize: 11.5, lineHeight: 1.38, color: Lab.ink },
  ask: { fontFamily: Fonts.sans, fontWeight: 600 as const, fontSize: 9.5, lineHeight: 1.36, color: Lab.ink },
  body: { fontFamily: Fonts.sans, fontSize: 9, lineHeight: 1.42, color: Lab.slate },
  small: { fontFamily: Fonts.sans, fontSize: 8, lineHeight: 1.36, color: Lab.slate },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 7.5,
    letterSpacing: 2.2,
    textTransform: "uppercase" as const,
    color: Lab.copper,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
    color: Lab.copper,
  },
  data: { fontFamily: Fonts.mono, fontSize: 7.5, letterSpacing: 0.3, color: Lab.slate },
  micro: { fontFamily: Fonts.mono, fontSize: 6.5, letterSpacing: 0.4, color: Lab.slate },
} as const;
