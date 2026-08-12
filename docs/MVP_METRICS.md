# Métricas TIER 1 — qué vamos a aprender

**Asunción más riesgosa:** las personas que calculan su carta valoran tanto la lectura humanizada (6 temas + PDF) y el pulso del año (Pro) que la comparten y/o pagarían $2.99.

Sin dashboard. Conteos en `localStorage` (`astro_learning_v1`) + breadcrumbs Sentry si hay DSN.

## Eventos

| Evento | Significado |
|---|---|
| `chart_created` | Activación: calculó una carta |
| `topics_opened` | Consumo free: abrió un tema |
| `pdf_downloaded` | Valor free / proxy de “lo compartiría” |
| `pro_unlock_clicked` | Intención: tocó el CTA de Pro |
| `pay_intent_yes` / `pay_intent_no` | ¿Pagaría $2.99 de verdad? |
| `pro_unlocked` | Conversión soft (tras “sí”) |
| `year_calculated` | Uso Pro: calculó el pulso del año |
| `returned_same_chart` | Retención débil: reabrió una carta guardada |
| `pro_preview_opened` | Abrió el preview in-page de Pro (enganche) |
| `pro_sample_pdf` | Descargó el PDF muestra Pro (Alex Rivera) |

## Definiciones de éxito (2 semanas)

- **Activation:** cartas que abren ≥1 tema **o** descargan PDF / cartas creadas  
- **Share proxy:** `pdf_downloaded` / `chart_created`  
- **Intent Pro:** `pro_unlock_clicked` / `chart_created`  
- **Willingness:** `pay_intent_yes` / (`pay_intent_yes` + `pay_intent_no`)  
- **Soft conversion:** `pro_unlocked` / `chart_created`

**Target orientativo (5–20 cartas, no vanity):** ≥30% PDF, ≥20% click unlock, ≥10% “sí pagaría”. Si no se acerca, ajustar copy o el offer — no añadir features.

Emails de aviso (opt-in) en `astro_pay_waitlist_v1`. No es CRM.
