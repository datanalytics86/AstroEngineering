import { Font } from "@react-pdf/renderer";

let done = false;

function src(file: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/fonts/${file}`;
  }
  return `/fonts/${file}`;
}

export function registerLabFonts(): void {
  if (done) return;
  done = true;
  Font.registerHyphenationCallback((word) => [word]);
  Font.register({
    family: "LabSerif",
    fonts: [
      { src: src("LibreBaskerville-Regular.ttf"), fontWeight: 400, fontStyle: "normal" },
      { src: src("LibreBaskerville-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: src("LibreBaskerville-Bold.ttf"), fontWeight: 700, fontStyle: "normal" },
    ],
  });
  Font.register({
    family: "LabSans",
    fonts: [
      { src: src("IBMPlexSans-Regular.ttf"), fontWeight: 400 },
      { src: src("IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "LabMono",
    fonts: [
      { src: src("IBMPlexMono-Regular.ttf"), fontWeight: 400 },
      { src: src("IBMPlexMono-Medium.ttf"), fontWeight: 500 },
    ],
  });
}
