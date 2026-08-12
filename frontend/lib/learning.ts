/**
 * Loop de aprendizaje TIER 1 (Ries / Maurya).
 * Eventos sin PII. Conteos en localStorage para el test de 5 usuarios.
 * Si hay Sentry DSN, también van como breadcrumb vía trackEvent.
 *
 * chart_created        — activación: alguien calculó una carta
 * topics_opened        — consumo free: abrió al menos un tema
 * pdf_downloaded       — valor free / proxy de share
 * pro_unlock_clicked   — intención: tocó el CTA de unlock
 * pay_intent_yes/no    — willingness to pay explícita ($2.99)
 * pro_unlocked         — conversión soft (desbloqueo simulado)
 * year_calculated      — uso Pro: calculó el pulso del año
 * returned_same_chart  — retención débil: reabrió una carta guardada
 */

import { trackEvent } from "./observability";

export type LearningEvent =
  | "chart_created"
  | "topics_opened"
  | "pdf_downloaded"
  | "pro_unlock_clicked"
  | "pay_intent_yes"
  | "pay_intent_no"
  | "pro_unlocked"
  | "year_calculated"
  | "returned_same_chart";

const STORE_KEY = "astro_learning_v1";
const EMAILS_KEY = "astro_pay_waitlist_v1";

interface LearningStore {
  counts: Partial<Record<LearningEvent, number>>;
  firstSeen: string;
}

function readStore(): LearningStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as LearningStore;
  } catch {
    /* ignore */
  }
  return { counts: {}, firstSeen: new Date().toISOString() };
}

function writeStore(store: LearningStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function trackLearning(
  name: LearningEvent,
  data?: Record<string, string | number | boolean>,
): void {
  try {
    const store = readStore();
    store.counts[name] = (store.counts[name] ?? 0) + 1;
    writeStore(store);
  } catch {
    /* ignore */
  }
  trackEvent(name, data);
}

export function savePayWaitlistEmail(email: string): void {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) return;
  try {
    const raw = localStorage.getItem(EMAILS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(EMAILS_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
}
