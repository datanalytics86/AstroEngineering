# PLAN — Oleada 0 consolidada

Fecha: 2026-10-05  
Orquestador: A0  
Rama: `release/v1-comercial` (desde `origin/claude/nifty-planck-13n6j3` @ `c75f905`; `git merge origin/main` → Already up to date)  
SPEC-002: Accepted por el dueño. Stack de §1 autorizado.

**Oleada 0 cerrada.** Dueño: «ejecuta la oleada 1» (2026-10-05). Gate 0 aprobado para ejecutar A1/A2/A3. D1/D3/D11 siguen pendientes para cobro y copy legal definitivo.

---

## 1. Línea base Anexo B — salida real

Máquina: Windows, Python 3.12.10, Node v22.23.2, npm 10.9.8. Sin Docker, sin WSL, sin MSVC, sin `gh`.

### 1.1 Backend — pytest / verify_corpus **NO CORRIERON**

`pyswisseph==2.10.3.2` no tiene rueda para CPython 3.12 Windows y falló al compilar:

```
Building wheel for pyswisseph (pyproject.toml): finished with status 'error'
error: Microsoft Visual C++ 14.0 or greater is required.
ERROR: Failed building wheel for pyswisseph
==== PYTEST ====
python.exe: No module named pytest
==== VERIFY_CORPUS ====
ModuleNotFoundError: No module named 'swisseph'
```

Conteo estático de `def test_` en `backend/tests/`: **88** (14+15+12+9+8+7+6+5+5+5+2). Coincide con “pytest 88/88” del SPEC. `HISTORICAL_EVENTS` = 52 ids, 2 con 2 firmas = **54** (A3). CI Ubuntu 3.11 sigue siendo la fuente de verdad; se reejecuta en Oleada 1 (A1-5).

### 1.2 pip-audit — **15 avisos** (H-02 CONFIRMADO)

Comando: `python -m pip_audit -r backend\requirements.txt --progress-spinner off`

```
Name      Version ID              Fix Versions
--------- ------- --------------- ------------
fastapi   0.109.0 PYSEC-2024-38   0.109.1
starlette 0.35.1  PYSEC-2026-1943 0.40.0
starlette 0.35.1  PYSEC-2026-1941 0.47.2
starlette 0.35.1  PYSEC-2026-161  1.0.1
starlette 0.35.1  PYSEC-2026-161  1.0.1
starlette 0.35.1  PYSEC-2026-2281 1.1.0
starlette 0.35.1  PYSEC-2026-2280 1.1.0
starlette 0.35.1  PYSEC-2026-249  1.3.1
starlette 0.35.1  PYSEC-2026-248  1.3.0
starlette 0.35.1  PYSEC-2026-249  1.3.1
starlette 0.35.1  PYSEC-2026-248  1.3.0
starlette 0.35.1  PYSEC-2026-1943 0.40.0
starlette 0.35.1  PYSEC-2026-1941 0.47.2
starlette 0.35.1  PYSEC-2026-2281 1.1.0
starlette 0.35.1  PYSEC-2026-2280 1.1.0
Found 15 known vulnerabilities in 2 packages
```

Starlette no está pineado: es transitivo de `fastapi==0.109.0` (`backend/requirements.txt:1`).

### 1.3 Frontend — i18n / interp / build OK; audit 4 vulns

`npm.cmd ci` (también reportó 12 vulns *con* dev):

```
npm warn deprecated next@14.2.3: This version has a security vulnerability.
OK: paridad i18n verificada (479 claves en ambos idiomas).
PASS advanced interpretation { house9_words: 101, asc_words: 128, tone9: 'constructive', empty_tone: 'constructive' }
```

`next build` (Next.js 14.2.3) — **OK**, First Load JS `/carta/[id]` **170 kB** (presupuesto S8: ≤ 200 kB):

```
Route (app)                              Size     First Load JS
┌ ○ /                                    1.52 kB         104 kB
├ ƒ /carta/[id]                          59.9 kB         170 kB
├ ○ /nueva                               10.8 kB         113 kB
├ ƒ /transitos/[id]                      36.1 kB         138 kB
+ First Load JS shared by all            87.4 kB
```

Warning de build: `Can't resolve 'fs'` en `components/pdf/register-lab-fonts.ts` (no falló el build).

`npm audit --omit=dev` (exit 1, esperado):

```
nanoid  <=3.3.17     high
next    0.9.9 - 16.3.0-preview.10   critical   (incluye GHSA-p293-qw3h-jr36 RCE Windows y GHSA-2xp9-vwfh-vxw4 RCE Image Optimization AVIF)
postcss <=8.5.22     high
qs      2.2.5 - 6.15.3  moderate
4 vulnerabilities (1 moderate, 2 high, 1 critical)
fix available via npm audit fix --force → next@14.2.35  ← insuficiente para los RCE ≥15.5.24
```

### 1.4 Producción en vivo (2026-10-05, esta sesión)

```
GET https://astro-engineering.vercel.app/api/checkout/status
{"enabled":false}

GET https://astro-engineering.vercel.app/api/health
status=200 elapsed_ms=22550 body={"status":"ok","service":"astroengine-backend"}
```

LICENSE: **no existe**.

### 1.5 Mediciones de carga / DoS / Playwright del Anexo B

**No reejecutadas** (sin Docker, sin pyswisseph local, sin Playwright instalado). El código de H-03/H-04/H-06/H-21 está confirmado; los números 35,3 s / 8,0 s / 98 % “apretado” quedan como evidencia del SPEC 2026-10-05, no de esta máquina. Se rehacen en Oleada 1 (A1-2, A2-2) y Oleada 2 (A6-1).

---

## 2. Matriz H-01 … H-33

Leyenda: **C** confirmado en código (y, si dice “medido”, también en esta sesión). **C\*** mecanismo confirmado, estadística del SPEC no reejecutada. **Ninguno refutado.**

| ID | Sev | Título | Veredicto | Evidencia archivo:línea | Agente |
|----|-----|--------|-----------|-------------------------|--------|
| H-01 | Crítica | Next 14.2.3 vulnerable; d3 muerto | **C** (audit medido) | `frontend/package.json:17,19,25`; 0 imports de `d3`; `npm audit --omit=dev` 1 critical | A1 |
| H-02 | Crítica | FastAPI/Starlette 15 avisos | **C** (audit medido) | `backend/requirements.txt:1`; pip-audit 15 | A1 |
| H-03 | Crítica | `natal_planets` sin tope | **C** | `backend/astro/models.py:41,64` | A2, A3 |
| H-04 | Crítica | Cómputo bloquea el event loop | **C** (código) | `backend/main.py:175-189,201-217,233-249,275-277` | A1, A3 |
| H-05 | Alta | Rate limit por IP del proxy | **C** | `backend/main.py:96`; `frontend/lib/backend-proxy.ts:37-51` no reenvía IP | A2 |
| H-06 | Alta | `/health` 10/min | **C** | `backend/main.py:162-163`; `render.yaml:14` | A1, A2 |
| H-07 | Alta | `*.vercel.app` en checkout | **C** | `frontend/lib/stripe-server.ts:19-24`; `session/route.ts` usa ese origin | A2, A4 |
| H-08 | Media | CSP `unsafe-eval` + Google Fonts | **C** | `frontend/next.config.mjs:28-40`; `app/layout.tsx:13-25` | A2 |
| H-09 | Media | `next start` + localhost revienta | **C** | `frontend/next.config.mjs:14-23` | A1 |
| H-10 | Media | Origen hardcodeado ×6 | **C** | `tier-minus1.ts:25`; `pro-sample.ts:53`; `share.ts:3`; `stripe-server.ts:21,31`; `robots.ts:10`; `sitemap.ts:4` | A1, A7 |
| H-11 | Media | Infra free no sirve para cobrar | **C** (código + 22,5 s medidos) | `render.yaml:13` `plan: free`; keepalive; health 22550 ms | A1 |
| H-12 | Crítica | Pro gratis + “Pago confirmado” | **C** (prod `enabled:false`) | `carta/[id]/page.tsx:166-168`; `TopicSummarySection.tsx:312-319,415-417,566-571`; `es.ts:198-199,221` | A4, A5, A8 |
| H-13 | Crítica | Stripe no sirve desde Chile; Paddle prohíbe horóscopos | **C** (código + políticas web) | checkout solo Stripe; Paddle AUP ítem 14; LS hay que preguntar | A4 |
| H-14 | Crítica | Compra en localStorage; webhook no-op | **C** | `storage.ts:220-279`; `webhook/route.ts:21-31` | A4, A8 |
| H-15 | Alta | Dueño sin datos de negocio | **C** | `learning.ts:41-94`; waitlist en localStorage | A7 |
| H-16 | Alta | Sin términos/reembolsos/contacto; privacidad 4 párrafos | **C** | no hay `app/(legal)/`; `privacidad/page.tsx:12-18` `text-slate-900` | A2, A6 |
| H-17 | Alta | AGPL sin LICENSE | **C** | no hay `LICENSE`; `requirements.txt:3` pyswisseph | A2 |
| H-18 | Alta | Nominatim autocomplete | **C** | `BirthDataForm.tsx:463-484` debounce 400 ms | A2, A5 |
| H-19 | Alta | TZ incorrecta fuera de lista corta | **C** | `BirthDataForm.tsx:94-121,123-126,534-536`; Corea → `round(127/15)=8` | A3 |
| H-20 | Alta | Quirón omitido en silencio | **C** | `chart.py:101-104`; `Dockerfile:12-13`; `.gitignore:18`; glosario `:122` | A3 |
| H-21 | Crítica | Mapa no distingue meses | **C\*** | `year-map.ts:246-247`; `personal-intensity.ts:71`; `transits.py:565` | A6 |
| H-22 | Crítica | Se vende el año calendario | **C** | `carta/[id]/page.tsx:146,155,195,234,263` `getFullYear()` | A5 |
| H-23 | Alta | Teaser Marzo/Julio fijo | **C** | `es.ts:193-194`; `TopicSummarySection.tsx:433-455` | A5 |
| H-24 | Alta | Copy genérico repetido | **C** | `year-map.ts:554,573-625,756-757`; `pro-human.ts:311-312` | A6 |
| H-25 | Alta | Concordancia de género | **C** | `pro-human.ts:126` + `tier-minus1.ts:179`; `year-map.ts:699` + `:193` | A6 |
| H-26 | Alta | 5 años de tránsitos gratis | **C** | `transitos/[id]/page.tsx:434`; no lee `isProUnlocked` | A5 |
| H-27 | Alta | Precio $2.99 hardcodeado | **C** | `stripe-server.ts:3`; 8 claves en `es.ts`/`en.ts`; `i18n.tsx:21,53-56` | A4, A6 |
| H-28 | Media | Contraste dark | **C** | 51 `text-slate-900`/`bg-white` en 19 archivos; H1 privacidad `:12` | A5 |
| H-29 | Media | `strip_whitespace` ignorado | **C** | `models.py:11` | A2 |
| H-30 | Media | CI incompleto | **C** | `ci.yml`: pytest+corpus+i18n+interp+build. Sin lint, vitest, e2e, audit, secrets | A8 |
| H-31 | Baja | Share expone nacimiento | **C** | `share.ts:22-32` Base64 de name\|date\|time\|lat\|lon | A2, A7 |
| H-32 | Baja | SEO limitado | **C** | `layout.tsx:17` `lang="es"`; no `/pro`; no JSON-LD; sitemap 4 URLs | A7 |
| H-33 | Baja | `CLAUDE.md` desactualizado | **C** | header 2026-07-10; Pro/Stripe/mapa no documentados | A0 |

---

## 3. Estado S1–S10 (fin Oleada 2, 2026-10-05)

| # | Criterio | Hoy |
|---|----------|-----|
| S1 | 0 vulns high/critical | **VERDE** local — `pip-audit` “No known vulnerabilities found”; `npm audit --omit=dev --audit-level=high` 0 high/critical (quedan 2 *moderate*: qs, baseline-browser-mapping) |
| S2 | Cero Pro sin pago | **CÓDIGO VERDE vs mock** — entitlement de servidor; `isProUnlocked` false; waitlist en prod. Persistencia real exige Neon (D6) |
| S3 | `/health` p95 < 200 ms bajo carga | **PARCIAL** — `/health` sin límite + cómputo en threadpool; p95 no medido (D8 free / cold start) |
| S4 | `/api/transits` p95 < 4 s Starter | **NO MEDIDO** (plan free) |
| S5 | Compra → Pro < 10 s, restaurable | **CÓDIGO vs mock** — `/pro/gracias` + magic link. Cobro live 🛑 D1 |
| S6 | Mapa distingue meses | **VERDE en tests** — `classifyClimate` relativo; 50 series ≥90% |
| S7 | Embudo medido | **CÓDIGO** — PostHog cookieless; key es runbook humano (D5) |
| S8 | Legales publicados | **PARCIAL** — `/privacidad` `/terminos` `/reembolsos` `/contacto` con placeholders D11. 🛑 no definitivos |
| S9 | CI completo | **CÓDIGO LISTO** — jobs pytest, corpus, pip-audit, lint, typecheck, vitest, i18n, interp, npm-audit high, build, Playwright smoke, gitleaks. Primer verde en GitHub Actions al pushear |
| S10 | Precisión ±0,05°; Quirón; corpus 54 | **PARCIAL** — Dockerfile + `fetch_ephe.py` con SHA-256 Anexo C; golden skip sin `.se1`; Windows sin pyswisseph. CI Ubuntu 3.11 es la fuente de verdad |

---

## 4. Plan por oleadas (sin ejecutar)

### Oleada 1 — listo para producción (P0 técnico)

PRs chicos hacia `release/v1-comercial`, ramas `v1/a<N>-<tema>`. Gates §8 en cada PR. **No billing real.**

| PR sugerido | Agente | Cierra | Notas |
|-------------|--------|--------|-------|
| `v1/a1-next16` | A1-1 | H-01 | Next 16.3 + React 19; quitar d3; ESLint 9; engines/.nvmrc |
| `v1/a1-backend-pins` | A1-2 | H-02, H-04 | pins + threadpool + semáforo + gzip + tzdata |
| `v1/a1-ephe` | A1-3 | H-20 (imagen) | `.se1` + SHA-256 Anexo C |
| `v1/a1-site-ci` | A1-4/5/6 | H-09, H-10, H-11, H-30 | `lib/site.ts`; guard solo `VERCEL_ENV=production`; CI completo; `render.yaml` starter **documentado** (activar cuando D8 esté pagado) |
| `v1/a2-proxy-limits` | A2-1/2/3 | H-03, H-05, H-06, H-29 | proxy firmado; natal_planets 1..20; `/health` sin límite; body 64 KB |
| `v1/a2-csp` | A2-4 | H-08 | nonce THEME_BOOT; next/font local |
| `v1/a2-license-legal` | A2-6/7 | H-16, H-17, H-31 (declarar) | LICENSE AGPL; páginas legales con **placeholders D11**; 🛑 dueño revisa copy |
| `v1/a2-allowlist` | A2-5 | H-07 | aunque checkout esté apagado |
| `v1/a3-places-tz` | A3-1/2 | H-18, H-19 | `/api/places` + `tz_name` |
| `v1/a3-events-cache` | A3-3/4/5 | base de H-21 | `raw_intensity`, `key_events`, LRU, golden 0,05° |

A8 revisa todo PR de seguridad. A6 no toca `es.ts` en Oleada 1 salvo claves que A2 pida para legales (vía `docs/v1/i18n-requests.md`).

### Oleada 2 — Pro que se vende — **HECHA** 2026-10-05

Mock + waitlist. D1/D3/D6/D8-pay/D11 siguen 🛑. No Lemon Squeezy activo. Store memoria.

### Oleada 3 — **HECHA** 2026-10-05

Dueño: «sigue con oleada 3». Puntos 1, 2, 5 (SEO sin desarchivar productos), 6, 8. Punto 3 Plus 🛑 go/no-go. Punto 7 Mercado Pago 🛑 D1. Punto 4 sinastría diferida (sin motor en el repo).

### Oleada 4

Regresión, carga, staging, docs, PR `release/v1-comercial` → `main` **sin merge**.

---

## 5. 🛑 Gate 0 — lo que necesito de ti

Aprueba este plan (Mensaje 2) y responde lo que falte. Mientras tanto **me detengo**.

1. **D1 — envía el mensaje a Lemon Squeezy** (texto en `DECISIONS.md`). Cuando tengas el sí/no escrito, pégalo aquí. Hasta entonces Oleada 2 usa `mock` + `waitlist`.
2. **D2 AGPL** — ya lo aceptaste. Confirma que el repo se queda **público** con LICENSE AGPL-3.0 y el enlace “Código fuente”.
3. **D3 dominio** — “todavía no” queda registrado. ¿Quieres un hostname concreto (`.cl` / `.app`) antes del 15-nov, o seguimos con `astro-engineering.vercel.app` hasta lanzar?
4. **D11** — cuando puedas: `{{LEGAL_NAME}}`, `{{RUT}}`, `{{ADDRESS}}`, `{{SUPPORT_EMAIL}}`. Sin esto las páginas legales salen con placeholders (Oleada 1) y **no se publican como definitivas**.
5. **D8 plata** — Vercel Pro US$20/mes + Render Starter US$7/mes. ¿Las cuentas se pagan en Oleada 1 o después? El código se prepara igual; keepalive no se borra hasta que Starter esté vivo.
6. **D4–D10** — tomé los valores recomendados (US$9,99 / CLP 8.990, PostHog, Neon, Resend, geo/calendario archivados, Plus apagado). Di si alguno cambia.
7. **Pregunta de producto (no bloquea Oleada 1):** ¿el CTA de waitlist recoge email en servidor ya en Oleada 2, o solo “avísame” local hasta tener Resend?

Cuando apruebes: *“Apruebo el plan de la Oleada 0 [cambios]. Ejecuta la Oleada 1 completa (A1, A2 y A3)…”*

**Gate 0 (2026-10-05):** el dueño dijo «ejecuta la oleada 1». A1/A2/A3 ejecutados en `v1/oleada-1`. D1/D3/D8-pago/D11 siguen 🛑.

---

## 6. Oleada 1 — resultados (salida real)

Máquina: Windows, Python 3.12.10, Node v22, npm 10.9.8. Sin Docker, sin MSVC, sin `gh`.

```
pip-audit -r backend/requirements.txt
No known vulnerabilities found

pytest backend/tests/test_timezone.py backend/tests/test_places.py -q
..............  14 passed in 0.77s

npm run lint          → 0 errors, 5 warnings (react-hooks/exhaustive-deps + unused eslint-disable)
npm run typecheck     → tsc --noEmit OK
npm test              → vitest 4/4 (lib/site.test.ts)
npm run check:i18n    → OK: paridad i18n verificada (515 claves en ambos idiomas)
npm run check:interp  → PASS advanced interpretation { house9_words: 101, asc_words: 128, … }
npm audit --omit=dev --audit-level=high → 0 high/critical
npm audit --omit=dev  → 2 moderate (qs, baseline-browser-mapping); exit 1 esperado
```

`next build --webpack` (Next.js 16.3.8): 19/19 páginas, rutas `/api/places`, `/privacidad`, `/terminos`, `/reembolsos`, `/contacto`. Esta versión no imprime First Load JS en la tabla. Warnings: middleware→proxy (se conserva middleware por CSP nonce); `Can't resolve 'fs'` en register-lab-fonts (preexistente, no fatal).

Playwright smoke local: **6 passed** (desktop 1440×900 + móvil Chromium 390×844; home, legales con `{{LEGAL_NAME}}`, footer “Código fuente”). `output: standalone` solo si `DOCKER_BUILD=1`.

pytest completo / `verify_corpus` / golden: no corridos en esta máquina (pyswisseph sin rueda CPython 3.12 Windows). CI Ubuntu 3.11 los corre.

H-xx **cerrados en código** esta oleada: H-01, H-02, H-03, H-04 (mecanismo), H-05, H-06, H-07, H-08, H-09, H-10, H-17, H-18, H-19, H-29, H-30. **Parciales:** H-11 (sigue `plan: free` hasta D8 pagado), H-16 (placeholders D11), H-20 (`.se1` en imagen; no verificado local), H-31 (declarado en privacidad). **Oleada 2:** H-12…H-15, H-21…H-28, H-32, H-33.

🛑 **Deploy:** setear el mismo `BACKEND_PROXY_KEY` en Vercel y Render **antes** de promover. Si falta, `/api/*` en production = 403. `/health` sigue abierto.
