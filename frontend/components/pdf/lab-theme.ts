import type { YearClimate } from "@/lib/year-map";

/** Celestial Laboratory — print tokens. Ratios vs ivory #F4EFE4 measured. */
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
