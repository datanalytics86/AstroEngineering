#!/usr/bin/env node
/**
 * Verifica paridad de claves entre lib/locales/es.ts y lib/locales/en.ts.
 * No depende de ningún compilador de TypeScript: extrae las claves de nivel
 * superior del objeto literal por regex (`"clave.algo": ...` o `'clave': ...`),
 * lo cual es suficiente porque ambos archivos son objetos planos de un solo nivel.
 *
 * Exit code 0 si las claves coinciden exactamente; exit code 1 y listado de
 * diferencias en caso contrario.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ES_PATH = path.join(__dirname, "..", "lib", "locales", "es.ts");
const EN_PATH = path.join(__dirname, "..", "lib", "locales", "en.ts");

// Extrae claves de la forma  "algo.clave": ...  o  'algo.clave': ...
// al inicio de línea (permitiendo espacios), ignorando comentarios `//`.
const KEY_RE = /^\s*["']([^"']+)["']\s*:/;

function extractKeys(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const keys = new Set();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("//")) continue;
    const match = KEY_RE.exec(rawLine);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function main() {
  const esKeys = extractKeys(ES_PATH);
  const enKeys = extractKeys(EN_PATH);

  if (esKeys.size === 0 || enKeys.size === 0) {
    console.error(
      `Error: no se extrajeron claves (es=${esKeys.size}, en=${enKeys.size}). ` +
        `Revisa las rutas o el formato de los archivos de locale.`
    );
    process.exit(1);
  }

  const missingInEn = [...esKeys].filter((k) => !enKeys.has(k)).sort();
  const missingInEs = [...enKeys].filter((k) => !esKeys.has(k)).sort();

  if (missingInEn.length === 0 && missingInEs.length === 0) {
    console.log(`OK: paridad i18n verificada (${esKeys.size} claves en ambos idiomas).`);
    process.exit(0);
  }

  console.error("FAIL: las claves de es.ts y en.ts no coinciden.\n");
  if (missingInEn.length > 0) {
    console.error(`Faltan en en.ts (${missingInEn.length}):`);
    for (const k of missingInEn) console.error(`  - ${k}`);
    console.error("");
  }
  if (missingInEs.length > 0) {
    console.error(`Faltan en es.ts (${missingInEs.length}):`);
    for (const k of missingInEs) console.error(`  - ${k}`);
    console.error("");
  }
  process.exit(1);
}

main();
