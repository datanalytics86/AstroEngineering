# Megaprompt multiagente — AstroEngine v1 comercial

> **Para:** Grok 4.7 en modo agente (Grok Build, Cursor u otro entorno con acceso al repo, terminal y navegador).
> **Preparado:** 2026-10-05 · **Base auditada:** `main` @ `72ccf4e`.
> **Objetivo:** dejar AstroEngine 100 % listo para producción comercial y convertir el módulo Pro en algo que la gente quiera comprar, con números que cierren.
> **Evidencia:** todo hallazgo de este documento se verificó contra el código y, cuando dice "medido" o "reproducido", se ejecutó en un contenedor (4 vCPU) el 2026-10-05. El Anexo B trae los comandos para reproducirlo.

---

## Cómo usar este documento (para el dueño, 3 minutos)

1. Rellena la tabla **§0 Decisiones del dueño** o deja los valores recomendados.
2. Copia desde `=== INICIO DEL PROMPT ===` hasta `=== FIN DEL PROMPT ===` y pégalo en Grok con el repo abierto. Si tu entorno de Grok lee archivos del repo, basta con decirle: *"Ejecuta `docs/v1/MEGAPROMPT_GROK_4.7.md`"*.
3. Grok trabaja por oleadas y solo te detiene en los gates marcados con 🛑.
4. Lo que Grok no puede hacer (crear cuentas, comprar dominio, verificar identidad en el proveedor de pagos, firmar textos legales) está en **§10 Runbook humano**.

### Resumen de la auditoría

1. **Hoy el Pro se regala.** Producción responde `{"enabled":false}` en `/api/checkout/status` (verificado en vivo el 2026-10-05). Así, "Probar Pro 30 días" desbloquea gratis, y la UI dice **"Pago confirmado"** aunque nadie pagó.
2. **Stripe no se puede activar desde Chile** sin una entidad extranjera: Chile no está en la lista oficial de países de Stripe. Si no tienes una entidad en otro país, el checkout actual no se podrá encender. Ojo con las alternativas: **Paddle prohíbe los horóscopos** en su política de uso, y Lemon Squeezy no los prohíbe por escrito pero hereda las restricciones de Stripe. Hay que confirmar con el proveedor antes de integrarlo.
3. **El mapa del año no distingue meses.** En 30 cartas aleatorias, el 98 % de los meses sale "apretado". El producto promete justo lo contrario: qué meses aprietan y cuáles te dejan respirar.
4. **Se vende el año calendario.** Si alguien compra hoy (octubre), 9 de los 12 meses ya pasaron.
5. **El teaser del paywall es el mismo para todos.** "Marzo se aprieta / Julio se afloja" está fijo en el código y suele contradecir el año real del usuario.
6. **Hay errores de gramática en la parte pagada**: "un clima interno *amplia, honesta*…", "un tono *seria, paciente*…".
7. **La compra vive solo en el navegador.** Si el cliente cambia de teléfono o borra datos, pierde lo que pagó. No hay restauración ni recibo con acceso.
8. **Hay vulnerabilidades críticas.** Next.js 14.2.3 tiene RCE conocidas y la línea 14.x ya no recibe todos los parches. FastAPI/Starlette acumulan 15 avisos.
9. **Una sola petición tumba el backend.** `/api/transits` acepta listas de planetas sin límite (400 planetas → 35 s) y bloquea todo el servidor, incluido `/health`.
10. **El rate limiting mira la IP equivocada** (todo llega desde el proxy de Vercel), y `/health` está limitado a 10/min mientras Render lo consulta 12 veces por minuto.
11. **Falla la precisión prometida.** Quirón no se calcula en producción (falta el archivo de efemérides), aunque el glosario lo presenta como parte de la carta. La zona horaria falla en muchos países: 1 h de error mueve el Ascendente ~15°.
12. **Falta lo legal.** No hay términos, reembolsos ni contacto. La privacidad son 4 párrafos y su título es casi invisible en tema oscuro. La Ley 21.719 rige desde el 1-dic-2026. El repo es público sin LICENSE y usa Swiss Ephemeris (AGPL).
13. **No hay datos de negocio.** Los eventos y los emails de la "lista de espera" se guardan en el navegador del visitante; al dueño nunca le llega nada.
14. **US$2,99 no deja margen.** Con un Merchant of Record (5 % + US$0,50), la comisión se come ~22 % de cada venta; a US$9,99 baja a ~10 %.

---

=== INICIO DEL PROMPT ===

# ROL Y MISIÓN

Eres **Grok 4.7 actuando como un equipo de 9 agentes** (1 orquestador + 8 especialistas) sobre el repositorio `datanalytics86/AstroEngineering`. Tu misión es llevar AstroEngine a **v1 comercial**:

1. **Listo para producción:** seguro, estable bajo tráfico real, observable y con deploy reproducible.
2. **Pro que se vende:** oferta clara, valor personal visible antes de pagar, cobro real que funcione desde Chile, entrega fiable y restaurable.
3. **Rentable y medible:** precios con margen y un embudo medido de punta a punta.
4. **Presentable legalmente:** términos, privacidad (Ley 21.719 de Chile y bases de GDPR), reembolsos y licencias en regla.

### Criterios de éxito (todos medibles)

| # | Criterio | Cómo se verifica |
|---|----------|------------------|
| S1 | 0 vulnerabilidades high/critical en dependencias de la app | `npm audit --omit=dev` y `pip-audit -r backend/requirements.txt` en CI |
| S2 | Ningún camino desbloquea Pro sin pago verificado en producción | Tests E2E + unitarios de entitlements (§8, invariantes de dinero) |
| S3 | `/health` p95 < 200 ms incluso con cómputos pesados en curso | Test de integración con uvicorn real + prueba de carga |
| S4 | `/api/transits` (12 meses) p95 < 4 s en Render Starter | Medición en staging, documentada en `docs/v1/PERF.md` |
| S5 | Compra → contenido Pro visible en < 10 s, y restaurable en otro dispositivo con el email | E2E con proveedor en modo test o adaptador simulado |
| S6 | El mapa del año distingue meses: en ≥ 90 % de 50 cartas aleatorias hay ≥ 2 meses de cada clima | Test automatizado (§7, A6-1) |
| S7 | Embudo medido: visita → carta → paywall visto → checkout → pago → reembolso | Dashboard de analítica descrito en `docs/v1/ANALYTICS.md` |
| S8 | Términos, privacidad, reembolsos y contacto publicados en ES/EN, enlazados en el footer | E2E + revisión del dueño 🛑 |
| S9 | CI verde: lint, typecheck, tests unitarios, E2E, i18n, `verify_corpus`, auditorías | GitHub Actions |
| S10 | Precisión intacta: ±0,05° y `verify_corpus` 54/54 PASS; Quirón presente | Tests existentes + nuevos |

---

## §0. DECISIONES DEL DUEÑO (el dueño las edita antes de pegar)

Lee esta tabla y úsala. Si una celda dice **PENDIENTE**, aplica la recomendación solo cuando es reversible y no compromete dinero ni la parte legal. Si no, detente en el gate 🛑 indicado.

| ID | Decisión | Valor | Recomendación y motivo |
|----|----------|-------|------------------------|
| D1 | Cómo cobrar (entidad legal + proveedor) | PENDIENTE | Si el dueño es persona o empresa en Chile **sin** entidad extranjera, la recomendación es **Lemon Squeezy** (Merchant of Record: paga a cuentas en Chile y se hace cargo de IVA/VAT, recibos y reembolsos), **solo después de que confirme por escrito** que acepta "reportes astrológicos personalizados generados por software (web + PDF)". Su lista de prohibidos no menciona la astrología, pero excluye "servicios de cualquier tipo" y todo lo que restrinjan sus procesadores (Stripe). **Paddle queda descartado**: su política de uso prohíbe "digital services associated with pseudo-science, including … horoscopes, fortune-telling". Respaldo o complemento local: **Mercado Pago** (CLP, medios chilenos; obliga a emitir boletas en el SII). Stripe solo sirve con una entidad en un país soportado (p. ej. LLC en EE.UU.). Cualquier otro MoR (Polar, Creem, Dodo…) exige revisar antes su política de uso. 🛑 bloquea el cobro real (Oleada 2). |
| D2 | Licencia de Swiss Ephemeris | PENDIENTE | (a) **AGPL**: el repo ya es público. Agregar LICENSE AGPL-3.0 (al menos en `backend/`) y un enlace visible "Código fuente" (costo 0, lanzamiento inmediato). (b) **Licencia profesional** de Astrodienst (700 CHF, ilimitada) si se quiere cerrar el código. 🛑 bloquea el lanzamiento comercial. |
| D3 | Dominio propio | PENDIENTE | Comprar antes del lanzamiento (p. ej. `.cl` o `.app`). Hace falta para el email transaccional (SPF/DKIM), la confianza y la verificación del proveedor de pagos. |
| D4 | Precios de lanzamiento | Mapa del Año US$9,99 / CLP 8.990 · Regalo igual · Mapa extra (order bump) US$5,99 · Plus US$4,99/mes o US$29,99/año (apagado) | Ver §4. Se define en un catálogo único: cambiar un precio no toca el código. |
| D5 | Analítica | PostHog (sin cookies) | Funnels y feature flags (tests de precio) en el plan gratis. Alternativa: Plausible (pago, más simple). |
| D6 | Base de datos | Neon Postgres + Drizzle | Plan gratis suficiente para empezar; driver serverless compatible con Vercel. Alternativa: Supabase. |
| D7 | Email transaccional | Resend | Plan gratis para empezar; plantillas en React. Alternativa: Postmark. |
| D8 | Plan de infraestructura | Vercel Pro (US$20/mes) + Render Starter (US$7/mes) | El plan Hobby de Vercel prohíbe el uso comercial; Render free (0,1 CPU, se duerme) no sirve para clientes que pagan. |
| D9 | Módulos archivados (`/geopolitica`, `/calendario`) | Seguir archivados en v1 | P2: reconvertir el calendario en páginas SEO gratuitas (Oleada 3). |
| D10 | Suscripción Plus | Apagada (feature flag) | Encender solo si se cumple el go/no-go de §4.3. |
| D11 | Identidad legal para los textos | PENDIENTE | Nombre o razón social, RUT, domicilio y email de soporte. **Nunca inventar:** usar placeholders `{{LEGAL_NAME}}`, `{{RUT}}`, `{{ADDRESS}}` y `{{SUPPORT_EMAIL}}`. |

---

## §1. REGLAS DE OPERACIÓN (no negociables)

1. **Lee primero** `AGENTS.md`, `CLAUDE.md`, `DEPLOY.md`, `README.md` y este documento completo. Este documento es el **SPEC-002 "v1 comercial", estado Accepted** por el dueño. Autoriza implementar lo descrito aquí y cumple la regla de AGENTS.md §1 ("solo implementa con Spec Accepted").
2. **Cambios de stack aprobados por este SPEC** (AGENTS.md §3 pide aprobación explícita, y esta lo es): Postgres gestionado + Drizzle (D6), email transaccional (D7), proveedor de cobro (D1), analítica (D5), rate limiting en el borde (Upstash Ratelimit o reglas de Vercel Firewall), Playwright + Vitest + ESLint, datos GeoNames y `tzdata` en el backend, Next.js 16 + React 19. Cualquier otra dependencia nueva necesita justificación escrita en el PR (qué resuelve, peso, alternativa descartada).
3. **Commits y PRs:** autorizados en ramas de trabajo (excepción explícita a "commits solo cuando el usuario lo pida" de AGENTS.md). Crea la rama de integración `release/v1-comercial` desde `main`, y ramas por agente `v1/a<N>-<tema>`. **Nunca** hagas push directo ni force-push a `main`. El merge a `main` es 🛑 del dueño.
4. **Evidencia o nada.** Toda afirmación sobre el código cita `archivo:línea`. Todo dato externo (precio, comisión, ley, política de un proveedor, API) se verifica con búsqueda web y se cita con URL. Si no puedes verificarlo, márcalo `[SIN VERIFICAR]` y no lo uses en copy público.
5. **Prohibido inventar** testimonios, número de usuarios, calificaciones, un "precio antes" falso, urgencia o escasez falsas, o la identidad legal del dueño.
6. **Invariantes técnicos:** precisión planetaria ±0,05°; `verify_corpus` 54/54 PASS; paridad i18n ES/EN; rate limits iguales o más estrictos; cero secretos en el repo; `.env.example` y `DEPLOY.md` actualizados con cada variable nueva.
7. **Todo cambio lleva su test.** Ningún test se salta, se marca `skip` ni se debilita para pasar.
8. **Ante alto riesgo o ambigüedad no cubierta por este SPEC, pregunta** (🛑) en vez de suponer. Lo cubierto aquí se ejecuta sin preguntar.
9. **Datos personales:** nunca registres en logs, analítica ni Sentry el nombre, la fecha u hora de nacimiento, las coordenadas ni el email en claro. Para analítica usa identificadores hasheados.

---

## §2. CONTEXTO VERIFICADO DEL REPO (2026-10-05)

- **Stack:** backend Python 3.11 + FastAPI 0.109 + pyswisseph 2.10.3.2 + slowapi; frontend Next.js 14.2.3 (App Router) + React 18 + TypeScript + Tailwind + `@react-pdf/renderer` + `stripe` (servidor). Deploy: Vercel (frontend, región `gru1`) + Render free (backend Docker, `render.yaml`).
- **Superficie activa:** `/` (landing "6 áreas"), `/nueva` (formulario, cartas guardadas, demo Einstein, enlaces compartidos), `/carta/[id]` (rueda, "Quién eres", 6 temas gratis, PDF "Mapa de vida" gratis, panel Pro), `/transitos/[id]` (5 años, gratis), `/retorno/[id]`, `/glosario`, `/privacidad`. **Archivados:** `/geopolitica` y `/calendario` (página "archivado"; el backend y el corpus siguen vivos).
- **Pro hoy:**
  - `components/TopicSummarySection.tsx` muestra el teaser, el modal de vista previa (muestra "Alex Rivera") y el CTA.
  - Con `STRIPE_SECRET_KEY`, el CTA va a Stripe Checkout (`app/api/checkout/session`), y al volver se verifica con `app/api/checkout/verify` y se guarda en localStorage (`unlockPro`).
  - Sin la clave, se abre el modal "Probar 30 días" y se desbloquea gratis 30 días en el dispositivo.
  - El contenido Pro (`lib/year-map.ts`, `lib/pro-human.ts`) se genera **en el cliente** a partir de `/api/transits` y `/api/solar-return`.
  - El PDF Pro de 8 placas se genera en el cliente (`components/pdf/ProYearDocument.tsx`).
- **Persistencia:** solo localStorage (`lib/storage.ts`). No hay base de datos, cuentas ni emails.
- **Proxies:** `lib/backend-proxy.ts` (timeout 55 s, `no-store`, 503 `backend_waking`). El navegador nunca llama al backend directo.
- **Observabilidad:** Sentry fail-soft en backend y frontend.
- **CI:** `.github/workflows/ci.yml` (pytest, verify_corpus, check:i18n, check:interp, build) y `keepalive.yml` (cron cada 10 min a `/health`).
- **Línea base medida:** pytest **88/88**, verify_corpus **54/54**, check:i18n OK (**479 claves**), check:interp PASS, `next build` OK (`/carta/[id]` First Load JS 170 kB).
- **Documentación:** `CLAUDE.md` describe el estado hasta 2026-07-10. Lo posterior (Pro, Stripe, mapa del año, UI "Celestial Laboratory", archivo de geo y calendario) no está documentado.

---

## §3. HALLAZGOS VERIFICADOS

Formato de cada hallazgo: **ID · severidad · título**, seguido de evidencia, impacto, corrección y criterio de aceptación. Antes de cambiar nada, cada agente confirma o refuta con evidencia los hallazgos de su área en la Oleada 0.

### A. Bloqueantes de producción (seguridad y estabilidad)

**H-01 · Crítica · Next.js 14.2.3 vulnerable, y la línea 14.x ya no se parchea por completo**
- **Evidencia:** `npm audit --omit=dev` reporta 4 vulnerabilidades (1 critical en `next`, high en `nanoid` y `postcss`, moderate en `qs`). Con `next@14.2.35` (último 14.x) sigue habiendo críticas (RCE en Image Optimization con AVIF y RCE en hosts Windows), que se corrigen recién en ≥ 15.5.24. Verificado con lockfile en una copia: `next@16.3.8` + `react@19` → **0 vulnerabilidades**; `next@15.5.27` → quedan 1 high (`postcss` empaquetado en next) y 1 moderate. `d3` y `@types/d3` están instalados y ningún archivo los importa.
- **Corrección:** migrar a **Next 16.3.x + React 19** (mínimo aceptable: 15.5.27, con el riesgo restante documentado) y eliminar `d3` y `@types/d3`. Puntos de cuidado:
  - En Next 16, `next build` usa Turbopack por defecto. La config `webpack` (alias `canvas` y `encoding` para @react-pdf, en `next.config.mjs`) puede pedir `turbopack.resolveAlias` o `next build --webpack`.
  - `next lint` ya no existe: hay que usar el CLI de ESLint 9 con flat config.
  - Los `params` son asíncronos en server components.
  - Se requiere Node ≥ 20.9: fíjalo con `engines` y `.nvmrc`.
- **Aceptación:** el build pasa; los 3 PDFs (Mapa de vida gratis, muestra Pro y Pro real) se generan en E2E; `npm audit --omit=dev` sin high/critical, como gate de CI.

**H-02 · Crítica · Backend con 15 avisos de seguridad (fastapi 0.109.0 / starlette 0.35.1)**
- **Evidencia:** `pip-audit -r backend/requirements.txt` → 15 avisos (fixes hasta starlette 1.3.1). Verificado en un venv aparte: con fastapi 0.142.2, starlette 1.7.0, uvicorn 0.54.0, pydantic 2.13.5, httpx 0.28.1, slowapi 0.1.10 y sentry-sdk 2.71.0, **pytest pasa 88/88** y pip-audit queda limpio para las dependencias de la app.
- **Corrección:** actualizar a esos pins (httpx sube de 0.27.2 a 0.28.1; borrar el comentario que justificaba el pin viejo) y agregar `tzdata`.
- **Aceptación:** `pip-audit` en CI sin high/critical; suite verde.

**H-03 · Crítica · DoS por payload: `natal_planets` sin límite**
- **Evidencia:** `backend/astro/models.py:41` (`TransitRequest.natal_planets: list[NatalPlanetIn]`) y `:64` (`MundaneRequest`). Medido: 10 planetas → 0,9 s; 100 → 8,7 s; 400 → **35,3 s** por petición en 4 vCPU. Render free tiene 0,1 CPU.
- **Corrección:** en `TransitRequest`, `Field(min_length=1, max_length=20)`; en `MundaneRequest`, `max_length=20` (la lista vacía sigue siendo válida en modo mundial). Además, límite de body de 64 KB (middleware) y timeout de cómputo.
- **Aceptación:** test: 400 planetas → 422 en < 50 ms.

**H-04 · Crítica · El cómputo bloquea el event loop**
- **Evidencia:** los endpoints de cómputo son `async def` y llaman funciones síncronas de CPU (`backend/main.py:177, 203, 235, 277`). Reproducido con uvicorn real: `/health` tardó **8,0 s** mientras corría un `/api/transits` pesado. Con un solo worker, un usuario congela a todos y Render reinicia el servicio por el health check.
- **Corrección:**
  - Pasar los endpoints de cómputo a `def` (threadpool) o usar `run_in_threadpool`.
  - Agregar un semáforo de cómputos pesados (2 por proceso).
  - Usar `WEB_CONCURRENCY=2` si la RAM alcanza (RSS medido ≈ 61 MB por proceso).
  - Agregar `GZipMiddleware` (la respuesta de tránsitos pesa ≈ 120 KB) y caché LRU de tránsitos por (huella de longitudes natales, rango).
- **Aceptación:** test de integración con uvicorn real: `/health` p95 < 200 ms durante un cómputo pesado.

**H-05 · Alta · Rate limiting por la IP equivocada**
- **Evidencia:** `Limiter(key_func=get_remote_address)` en `backend/main.py:96`. Todo el tráfico llega desde los proxies de Next (`lib/backend-proxy.ts`), que no reenvían la IP del cliente, y uvicorn no confía en `X-Forwarded-For` por defecto. Todos los usuarios comparten unos pocos buckets, así que con tráfico real los clientes legítimos reciben 429. Ejemplo: 5/min en `/api/transits`, que es justo el cálculo del Pro.
- **Corrección:**
  - Secreto compartido proxy → backend en el header `X-Astro-Proxy-Key` (env `BACKEND_PROXY_KEY` en Vercel y Render).
  - El proxy reenvía la IP real en `X-Astro-Client-IP` (primer valor de `x-forwarded-for` en Vercel).
  - Un `key_func` usa esa IP **solo si** el secreto es válido.
  - En producción, responder 403 a toda petición sin secreto válido, salvo `/health`. Esto también cierra el abuso directo de la URL pública de Render.
  - Agregar rate limit en el borde para `/api/*` de Next, por IP.
- **Aceptación:** tests: dos IPs distintas → buckets separados; header de IP sin secreto → ignorado; sin secreto en producción → 403.

**H-06 · Alta · `/health` limitado a 10/min mientras Render lo consulta cada 5 s**
- **Evidencia:** `backend/main.py:162-163`. Render consulta el health check cada 5 s (12/min). Reproducido: un sondeo local de `/health` recibió `{"error":"Rate limit exceeded: 10 per 1 minute"}`. Sumado a H-04, provoca reinicios en cascada.
- **Corrección:** `/health` sin rate limit, O(1) y sin I/O. Opcionalmente, `/ready` aparte que verifique las efemérides.

**H-07 · Alta · Cualquier `*.vercel.app` puede usar tu checkout para redirigir a su sitio**
- **Evidencia:** `requestOrigin()` acepta cualquier `https://*.vercel.app` (`frontend/lib/stripe-server.ts:19-33`). Cualquiera puede crear sesiones de cobro a tu nombre que redirigen a su dominio, lo que permite phishing con tu propio checkout.
- **Corrección:** allowlist exacta derivada de `SITE_URL`; las previews solo se aceptan si `VERCEL_ENV=preview`.

**H-08 · Media · CSP débil y fuentes de terceros**
- **Evidencia:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (`frontend/next.config.mjs:28-40`). Las fuentes se cargan desde Google Fonts (`app/layout.tsx`), lo que envía la IP del usuario a un tercero. `connect-src` incluye el backend y Nominatim.
- **Corrección:**
  - Nonce o hash para el script inline de tema (`THEME_BOOT`).
  - Quitar `'unsafe-eval'`. Si @react-pdf/yoga lo exige, usar `'wasm-unsafe-eval'` y probar los 3 PDFs.
  - Pasar las fuentes a `next/font` local (ya existen TTF en `public/fonts` para los PDFs).
  - Limpiar `connect-src` después de H-05 y H-18.
  - Agregar HSTS al tener dominio propio.

**H-09 · Media · El guard de `next.config.mjs` impide `next start` con backend local**
- **Evidencia:** `frontend/next.config.mjs:14-23` lanza error ante cualquier URL localhost cuando `NODE_ENV=production`. Reproducido: `next start` con `BACKEND_URL=http://localhost:8000` no arranca. Esto bloquea el E2E en CI.
- **Corrección:** validar solo cuando `VERCEL_ENV === "production"`.

**H-10 · Media · Origen del sitio hardcodeado en 6 lugares**
- **Evidencia:** `lib/tier-minus1.ts:25`, `lib/pro-sample.ts:53`, `lib/share.ts:3`, `lib/stripe-server.ts:21,31`, `app/robots.ts:10` y `app/sitemap.ts:4`. Esto bloquea el dominio propio (D3).
- **Corrección:** `frontend/lib/site.ts` con un único `SITE_URL` y su validación.

**H-11 · Media · La infraestructura actual no sirve para cobrar**
- **Evidencia:** el plan Hobby de Vercel es solo para uso no comercial; cobrar exige Pro (US$20 por miembro al mes). Render free tiene 0,1 CPU y se duerme a los 15 min; Render Starter cuesta US$7/mes, con 0,5 CPU y siempre encendido. Medido en vivo el 2026-10-05: `GET https://astro-engineering.vercel.app/api/health` tardó **23,4 s** con el backend dormido, pese al keepalive. `render.yaml` no define `region` (queda en Oregon por defecto) mientras Vercel corre en `gru1` (São Paulo). Con plan pago, el keepalive cada 10 min sobra. Además, GitHub desactiva los crons de repos públicos tras 60 días sin actividad (último push: 2026-08-25).
- **Corrección:** `render.yaml` con `plan: starter` y región decidida tras medir la latencia Vercel→Render (alinear regiones; cambiar la región en Render exige crear un servicio nuevo). Retirar `keepalive.yml` al pasar a plan pago. Documentarlo en `DEPLOY.md`.

### B. Bloqueantes comerciales y legales

**H-12 · Crítica · Pro gratis en producción y un mensaje falso de pago**
- **Evidencia:** sin `STRIPE_SECRET_KEY`, el CTA "Probar Pro 30 días" desbloquea sin pago:
  - `app/carta/[id]/page.tsx:166-183` (`unlockPro(id, false)`)
  - `components/TopicSummarySection.tsx:312-319` y `566-571`

  Después la UI muestra **"Pago confirmado. Activo en este dispositivo…"** (`TopicSummarySection.tsx:415-417`, que usa `es.ts:198`) para un desbloqueo con `source:"soft"`. Verificado en el flujo real: el registro en localStorage fue `{"unlocked":true,…,"source":"soft"}`. Y producción tiene el checkout apagado: `GET /api/checkout/status` → `{"enabled":false}` (en vivo, 2026-10-05).
- **Corrección:** en producción ningún camino desbloquea Pro sin pago verificado. Agregar `PRO_MODE=live|waitlist|dev`:
  - `waitlist`: CTA "Avísame cuando abra", con email persistido en servidor y consentimiento.
  - `dev`: permitido solo en desarrollo y previews.
  - Cualquier "prueba" debe ser explícita, del lado del servidor y rotulada como prueba.

**H-13 · Crítica · Stripe no está disponible para empresas chilenas**
- **Evidencia:** en América Latina, stripe.com/global solo lista Brasil y México. El checkout actual solo se activaría con una entidad extranjera. Además, no cualquier proveedor acepta astrología: Paddle la prohíbe en su política de uso (ítem 14: horóscopos y adivinación); Lemon Squeezy prohíbe "servicios de cualquier tipo" y lo restringido por Stripe (que prohíbe "psychic services and fortune tellers" en Japón, México, Tailandia y EAU).
- **Corrección:** abstracción de cobro con adaptadores (§5) y proveedor según D1, con aceptación del producto confirmada por escrito por el proveedor antes de integrarlo. Mantener el adaptador de Stripe portando el código actual.

**H-14 · Crítica · Lo comprado vive solo en localStorage, y el webhook no hace nada**
- **Evidencia:** `lib/storage.ts:220-279` guarda el desbloqueo en el navegador; `app/api/checkout/webhook/route.ts` solo hace `console.info`. Consecuencias:
  - El cliente pierde lo pagado al cambiar de dispositivo o borrar datos (riesgo de contracargos).
  - No hay recibo con acceso ni restauración.
  - Cualquiera puede escribir `astro_pro_<id>` en devtools y desbloquear.
- **Corrección:** entitlements en servidor, webhook idempotente, restauración por email (magic link) y contenido Pro servido solo con derecho verificado (§5, A4).

**H-15 · Alta · El dueño no recibe ningún dato de negocio**
- **Evidencia:** `trackLearning` y `savePayWaitlistEmail` escriben en el localStorage del visitante (`lib/learning.ts:41-94`). Los breadcrumbs de Sentry solo viajan si hay un error. El dueño no ve ni un evento ni un email, y la investigación de "¿pagarías?" se perdió.
- **Corrección:** analítica real (D5), eventos de compra desde el servidor y opt-in de email persistido con consentimiento y doble confirmación (A7).

**H-16 · Alta · Falta la parte legal**
- **Evidencia:**
  - No hay Términos, Reembolsos, Contacto/soporte ni identidad del vendedor. Los MoR y las pasarelas los exigen para aprobar la cuenta.
  - `/privacidad` son 4 párrafos, cita "$2.99/Stripe", y su H1 es casi invisible en tema oscuro (medido: color `rgb(15,23,42)` sobre fondo oscuro).
  - La **Ley 21.719** (Chile) rige desde el **2026-12-01** (hay una posible postergación en evaluación; verifícalo).
  - Si encuentras fuentes viejas sobre la falta penal por "pronósticos o adivinaciones" con fines de lucro (art. 496 N°32 del Código Penal), ignóralas: la Ley 19.918 la derogó en 2003. Igual, el copy debe presentar el producto como orientación y autoconocimiento, no como predicción.
  - Falta un aviso de "orientación y entretenimiento; no reemplaza consejo médico, psicológico, financiero ni legal", relevante para los temas Salud y Dinero.
- **Corrección:** A2-7 (§7).

**H-17 · Alta · Licencia AGPL sin cumplir**
- **Evidencia:** el backend enlaza Swiss Ephemeris y pyswisseph, ambos AGPL-3.0 (verificado en el metadata de pyswisseph). El repo es **público y no tiene archivo LICENSE**.
- **Corrección:** según D2: (a) LICENSE AGPL-3.0 más un enlace "Código fuente" visible para los usuarios, o (b) licencia profesional de Astrodienst y luego repo privado. En ambos casos, archivo `NOTICE` con terceros: Swiss Ephemeris, pyswisseph, GeoNames (CC BY 4.0) y las fuentes OFL.

**H-18 · Alta · El geocoding viola la política de Nominatim**
- **Evidencia:** `components/BirthDataForm.tsx:463-487` consulta Nominatim en cada tecla (debounce de 400 ms). La política de OSMF prohíbe autocompletar con su API pública, exige ≤ 1 req/s y caché. Si bloquean el sitio, el formulario (la entrada del embudo) deja de funcionar.
- **Corrección:** endpoint propio `/api/places` con GeoNames, que trae la zona IANA de cada ciudad (A3-1).

**H-19 · Alta · Zona horaria incorrecta fuera de una lista corta de países**
- **Evidencia:** `COUNTRY_TZ` asigna una sola zona por país y, si el país no está, usa `round(lon/15)` sin horario de verano (`BirthDataForm.tsx:536`). Ejemplos de error:
  - Corea → UTC+8 (la real es +9).
  - Irlanda, Chequia e Israel en verano → 1 h de error.
  - Punta Arenas después de 2016.
  - Estados de México que no están en la tabla.

  Además, el offset se calcula al mediodía en la zona del navegador, no en el instante de nacimiento. 1 h de error ≈ 15° de Ascendente: casas y "6 áreas" equivocadas, que es el producto central.
- **Corrección:** resolver la zona IANA en el servidor y calcular el offset con `zoneinfo` en la hora local exacta (A3-2).

**H-20 · Alta · Quirón no se calcula en producción**
- **Evidencia:** la imagen no trae archivos `.se1` (`backend/Dockerfile`; `.gitignore` excluye `*.se1`), y `astro/chart.py:101-104` omite el cuerpo sin avisar. Verificado: `/api/chart` devuelve 11 cuerpos sin Quirón. Mientras tanto, el glosario lo presenta como parte de la carta (`glossary.planets.subtitle`; ficha en `app/glosario/page.tsx:122`), y la rueda y el modal lo soportan. Además, `landing.features.natal.desc` ("12 planetas…") y `landing.planets.more_desc` son claves huérfanas que nadie usa. También verificado: con los archivos oficiales, la misma carta devuelve 12 cuerpos (Quirón 103,2341°).
- **Corrección:** A1-3 (archivos y checksums en el Anexo C). Borrar las claves i18n huérfanas o volver a usarlas con datos correctos.

### C. Por qué el Pro no se vende hoy (valor percibido)

**H-21 · Crítica · El mapa del año no distingue meses**
- **Evidencia:** medido en 30 cartas aleatorias con tránsitos de 2026:
  - **98 %** de los meses clasifican como "apretado".
  - **30 de 30** cartas tienen ≥ 10 de 12 meses "apretado".
  - El 49 % de los meses toca el techo de 10.
  - La mediana del rango anual es 2,6/10.

  La causa: el `intensity_score` mensual del backend llega o supera 10 en casi la mitad de los meses, el frontend lo recorta a 0–10 (`lib/personal-intensity.ts`), y `climateOf` usa un umbral absoluto (`frontend/lib/year-map.ts:246-247`: `value >= 6.5`). En el flujo real (demo Einstein), los 12 meses dicen variantes de "se aprieta" y el gráfico es una meseta entre 8 y 10.
- **Corrección:** normalización relativa por persona (A6-1).

**H-22 · Crítica · Se vende el año calendario**
- **Evidencia:** `new Date().getFullYear()` en `app/carta/[id]/page.tsx:146, 155, 195, 234, 263`. Comprado en octubre, 9 de 12 meses ya pasaron. Observado en el flujo real: en octubre, el "pulso" aconseja "Deja margen alrededor de enero y febrero".
- **Corrección:** 12 meses móviles desde el mes actual, más un producto "Tu {año+1}" activo de noviembre a enero (A4/A5/A6).

**H-23 · Alta · El teaser engaña y no despierta curiosidad**
- **Evidencia:**
  - Las barras fijas "Marzo se aprieta / Julio se afloja" son iguales para todos (`es.ts:193-194`; `TopicSummarySection.tsx:443-455`) y suelen contradecir el año real del usuario.
  - La línea "bloqueada" con blur es un titular gratuito que el usuario ya leyó arriba (`TopicSummarySection.tsx:433-441`).
  - No hay ancla de precio, garantía, comparación ni muestra personal.
- **Corrección:** paywall con datos reales (§4.4, A5-1).

**H-24 · Alta · Textos genéricos y repetidos**
- **Evidencia:** hay 4 variantes de texto × 3 climas, y la misma frase aparece 3 veces en un año. Observado: "Deja margen en amor y dinero. No llenes el calendario hasta el borde." en enero, mayo y septiembre. Además no se muestran fechas concretas, aunque el motor ya las calcula (`exact_date`, `enters_orb`, `leaves_orb`).
- **Corrección:** meses anclados a eventos con fechas, sin duplicados (A6-2).

**H-25 · Alta · Errores de concordancia en la parte pagada**
- **Evidencia:** los adjetivos femeninos de `VOICE[sign].es.style` (pensados para "una presencia…") se reutilizan con sustantivos masculinos:
  - "un clima interno *amplia, honesta…*": `lib/pro-human.ts:126` con `lib/tier-minus1.ts:179`.
  - "un tono *seria, paciente…*": `solarTone` en `lib/year-map.ts` con `tier-minus1.ts:193`.
- **Corrección:** A6-3.

**H-26 · Alta · Lo gratis canibaliza al Pro**
- **Evidencia:** `/transitos/[id]` entrega gratis 5 años de tránsitos con ~270 interpretaciones (`app/transitos/[id]/page.tsx:434`), y se llega desde "Cartas guardadas" en `/nueva`.
- **Corrección:** gating por plan (A5-6).

**H-27 · Alta · Precio hardcodeado y sin margen**
- **Evidencia:** "$2.99" aparece en 8 claves en cada idioma (`es.ts`/`en.ts` líneas 73, 133, 217, 220, 222, 224, 228 y 246) y en `PRO_AMOUNT_CENTS = 299` (`lib/stripe-server.ts:3`). El helper `t()` no interpola variables (`lib/i18n.tsx`).
- **Corrección:** catálogo único (§5) más `t(key, vars)` con `{price}`. `check-i18n` debe verificar que los placeholders sean iguales en ES y EN.

**H-28 · Media · Contraste roto en el tema oscuro (el default)**
- **Evidencia:** `text-slate-900` y `bg-white` aparecen 51 veces en 19 archivos. Sumando `text-slate-500/600` y los fondos `bg-*-50`, son 183 usos en 23 archivos. Afecta, entre otros, a `app/privacidad`, el encabezado "Detalle técnico" de `app/carta/[id]`, `app/glosario`, `error`, `not-found`, `InterpretationModal` y `ChartSummary`.
- **Corrección:** usar tokens (`text-ink`, `bg-card`…) y agregar un test axe de contraste en E2E.

**H-29 · Media · Pydantic ignora `strip_whitespace`**
- **Evidencia:** `Field(strip_whitespace=True)` no tiene efecto en Pydantic v2 (`backend/astro/models.py:11`; aparece como warning en pytest).
- **Corrección:** `Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]`.

**H-30 · Media · CI incompleto**
- **Evidencia:** CI no tiene lint, tests unitarios de frontend, E2E, auditoría de dependencias ni escaneo de secretos.

**H-31 · Baja · El enlace para compartir expone datos de nacimiento**
- **Evidencia:** codifica nombre, fecha, hora y coordenadas en la URL (`lib/share.ts`).
- **Corrección:** declararlo en la política de privacidad. P2: tokens cortos con expiración.

**H-32 · Baja · SEO limitado**
- **Evidencia:** `<html lang="es">` está fijo, el contenido en inglés no se indexa, no hay `hreflang` ni JSON-LD, y no existe una landing `/pro` indexable.

**H-33 · Baja · `CLAUDE.md` desactualizado desde 2026-07-10.**

---

## §4. ESTRATEGIA DE RENTABILIDAD (el porqué de todo el plan)

### 4.1 Benchmarks de mercado

Los valores vienen de fuentes públicas o de comparativas de 2026. Verifica antes de citarlos en copy público.

| Referente | Modelo | Precio |
|-----------|--------|--------|
| Cafe Astrology: reportes anuales generados (50 a 200+ págs.) | Pago único | US$3,50–7,95 |
| astro.com: *Yearly Horoscope Analysis* (Liz Greene, 45–50 págs.) | Pago único | US$69,90 |
| CHANI | Suscripción | US$11,99/mes · US$107,99/año |
| The Pattern | Suscripción | ~US$9,99/mes |
| Sanctuary+ | Suscripción | US$14,99/mes · US$49,99/año |
| Co-Star Plus | Suscripción | ~US$29,99/año |
| Lectura humana en Chile (90–120 min) | Sesión | CLP 50.000–55.000 |

**Lectura:** el "reporte generado" va de US$4 a US$70. Lo que mueve el precio percibido es la **personalización visible**, las **fechas concretas** y el **diseño del objeto**. AstroEngine ya tiene el diseño (PDF de 8 placas, UI premium). Le faltan personalización real (H-21, H-24) y fechas (H-24).

### 4.2 Posicionamiento

**"Tu año, en claro. Calculado con tu cielo real."** Dirigido a hispanohablantes que no saben astrología: lenguaje de vida (amor, dinero, trabajo, salud, familia, crecimiento), con precisión técnica detrás (Swiss Ephemeris) y un objeto que se guarda y se regala (el PDF). Sin app que instalar y sin suscripción obligatoria.

### 4.3 Escalera de oferta

| Nivel | Qué incluye | Precio de lanzamiento | Rol |
|-------|-------------|-----------------------|-----|
| **Gratis** | Carta, "Quién eres", 6 áreas, PDF "Mapa de vida" y, nuevo, **tu mes actual** del mapa Pro (resumen, acción y 2 áreas) más el número de fechas clave de tus próximos 12 meses (con las fechas difuminadas) | 0 | Adquisición y momento "ajá" |
| **Mapa del Año** (pago único por persona) | 12 meses móviles · fechas clave con días exactos · 6 áreas por mes · tono del año (retorno solar) · PDF de 8 placas · calendario `.ics` · recordatorio mensual por email durante 12 meses · restauración por email · garantía de 14 días | US$9,99 / CLP 8.990 (después, test contra 12,99) | Producto núcleo |
| **Regalo** | El mismo producto para otra persona: email del destinatario y fecha de entrega | Igual | Estacionalidad (Navidad, cumpleaños) |
| **Order bump** (en el checkout) | "Agrega el mapa de otra persona" | US$5,99 | Sube el ticket promedio |
| **Plus** (P2, flag apagado) | Mapas ilimitados (familia), 5 años, vista técnica de tránsitos, sinastrías, email semanal | US$4,99/mes · US$29,99/año | Recurrencia, solo después de validar el pago único |

**Go/no-go de Plus:** encenderlo solo si en 30 días de venta real hay ≥ 50 compras únicas o la conversión carta → pago es ≥ 2 %.

### 4.4 Paywall que vende (especificación para A5 y A6)

1. **"Tu año de un vistazo", con datos reales:** 12 chips de mes con su clima ya normalizado (intenso / ventana / respiro), visibles gratis. El detalle va bloqueado.
2. **El mes actual completo como muestra:** genera reciprocidad y prueba la calidad.
3. **"Tienes N fechas clave entre {mes} y {mes+11}"**, con las fechas difuminadas. La curiosidad se apoya en datos reales.
4. **Precio local** (CLP para Chile según `x-vercel-ip-country` o el idioma; USD en el resto, si el proveedor lo soporta) más "pago único, sin suscripción", la **garantía de 14 días** y los medios de pago del proveedor.
5. **Ancla honesta:** comparación con una lectura humana (~CLP 50.000) solo como contexto. Nunca un "precio antes" inventado.
6. **Tabla Gratis vs. Mapa del Año** y FAQ de 5 preguntas: ¿qué recibo?, ¿y si cambio de teléfono?, ¿hay reembolso?, ¿necesito saber astrología?, ¿esto es una predicción?
7. **Muestra descargable** ("Alex Rivera", rotulada como ejemplo).
8. **Estados** completos: cargando, `waitlist` (sin proveedor) y error con reintento.
9. **Copy de beneficio sin jerga.** El CTA usa la tipografía principal, no la monoespaciada.
10. **Después de pagar:** desbloqueo en < 10 s, PDF, `.ics`, email con acceso y botón "Regalar uno".

### 4.5 Unit economics (supuestos explícitos)

- **Comisión estimada de un MoR:** 5 % + US$0,50 (Lemon Squeezy suma 1,5 % en ventas internacionales). Los precios incluyen impuestos: donde aplica IVA/VAT (p. ej. 19 % en Chile), el MoR lo retiene y el neto baja. Valídalo con el proveedor elegido.

| Precio | Comisión aprox. | Neto aprox. (antes de IVA/VAT) | % comisión |
|--------|-----------------|--------------------------------|------------|
| US$2,99 | 0,65–0,69 | ~2,30 | ~22–23 % |
| US$9,99 | 1,00–1,15 | ~8,85–8,99 | ~10–11,5 % |
| US$12,99 | 1,15–1,35 | ~11,65–11,85 | ~9–10 % |

- **Costos fijos mínimos para cobrar:** Vercel Pro 20 + Render Starter 7 + dominio ~1,5 + Neon, Resend, PostHog y Sentry en plan gratis (0) ≈ **US$29/mes**. Pago único, solo si D2 = cerrado: licencia de Swiss Ephemeris, 700 CHF (≈ US$800–900).
- **Punto de equilibrio:**
  - A US$9,99: ~4 ventas/mes para cubrir la infraestructura, o ~12/mes si además se amortiza la licencia en 12 meses.
  - A US$2,99: ~13/mes para la infraestructura, o ~45/mes con la licencia.
- **Escenarios** (hipótesis a validar, no datos):

| Escenario | Cartas/mes | Conversión carta → pago | Ventas | Neto/mes aprox. |
|-----------|-----------|-------------------------|--------|-----------------|
| Conservador | 1.000 | 1,5 % | 15 | ~US$130 |
| Base | 5.000 | 2,5 % | 125 | ~US$1.100 |
| Optimista | 20.000 | 3,5 % | 700 | ~US$6.200 |

**Conclusión:** el ingreso es (cartas por mes) × (conversión) × (ticket). Por eso la analítica y los bucles de adquisición (compartir, SEO, regalo) importan tanto como las features.

### 4.6 Embudo y eventos (contrato para A7)

`landing_viewed → form_started → place_selected → chart_created → topics_opened → paywall_viewed → pro_preview_opened → checkout_started → purchase_completed (server) → pro_content_viewed → pdf_downloaded / ics_downloaded → share_clicked → gift_purchased (server) → refund_issued (server)`.

**Objetivos iniciales orientativos** (ajustar con datos reales a las 2–4 semanas):

| Paso del embudo | Objetivo |
|-----------------|----------|
| `form_started` / `landing_viewed` | ≥ 35 % |
| `chart_created` / `form_started` | ≥ 60 % |
| `paywall_viewed` / `chart_created` | ≥ 50 % |
| `checkout_started` / `paywall_viewed` | ≥ 6 % |
| `purchase_completed` / `checkout_started` | ≥ 45 % |
| Reembolsos | < 5 % |

### 4.7 Estacionalidad: "Tu 2027"

Hoy es 2026-10-05. La ventana fuerte del producto "año que viene" va de noviembre a enero (Año Nuevo y regalos de Navidad).

- **Meta:** Oleadas 1 y 2 en producción antes del **15-nov-2026**, con "Tu 2027" a la venta desde esa fecha (SKU con ventana enero–diciembre 2027, también para regalo).
- Fuera de esa ventana, el default son 12 meses móviles.
- Los cumpleaños ocurren todo el año: P2, sugerir "Regala su año" en el mes del cumpleaños del destinatario.

### 4.8 Palancas de adquisición (P1/P2)

- **Tarjetas para compartir** (`next/og`): "Mis 6 áreas" y "Mi 2027 en 3 palabras", con `?ref=`.
- **PDF gratis** con enlace y QR hacia `/pro`.
- **Landing `/pro` indexable** con FAQ y JSON-LD (Product, FAQPage).
- **Páginas SEO con valor real:** glosario renderizado en servidor, "Mercurio retrógrado 2027: fechas" y lunaciones, reutilizando el backend del calendario archivado.
- **Email mensual "tu mes"** para quienes dieron opt-in, con 1 fecha clave gratis y oferta del mapa.
- **Afiliados** (astrólogos y creadores) mediante las herramientas del MoR.

---

## §5. ARQUITECTURA OBJETIVO (v1)

```
Navegador ──► Next.js 16 (Vercel Pro, región alineada con el backend)
               ├─ Páginas: gratis + Pro (render de JSON) + /pro + /mis-mapas + legales
               ├─ /api/chart | /api/transits | /api/solar-return | /api/places
               │     └─ proxy firmado (X-Astro-Proxy-Key + X-Astro-Client-IP) ─► FastAPI (Render Starter)
               ├─ /api/pro/*      (entitlements, year-map JSON, .ics; PDF en servidor = P1)
               │     ├─► Postgres (Neon)        └─► FastAPI (tránsitos, retorno, eventos clave)
               ├─ /api/billing/*  (checkout, webhook/<provider>, status) ─► Adaptador del proveedor (D1)
               ├─ /api/auth/*     (magic-link, verify, logout) ─► Resend
               └─ Analítica: PostHog sin cookies (cliente) + eventos server-side (webhook)
FastAPI: cálculo puro y sin estado; efemérides .se1 en la imagen; places + zona horaria desde GeoNames.
```

### 5.1 Modelo de datos (Postgres, Drizzle)

- `customers(id uuid pk, email citext unique, locale, marketing_opt_in bool, opt_in_at, created_at)`
- `charts(id uuid pk, customer_id fk, fingerprint text, birth_enc bytea, created_at)`. `fingerprint` = HMAC-SHA256 con `CHART_PEPPER` sobre `"YYYY-MM-DD|HH:MM|lat4|lon4|tz_name"`. `birth_enc` = AES-256-GCM con `DATA_ENC_KEY` sobre `{name, date, time, lat, lon, tz_name, city}`.
- `orders(id uuid pk, provider, provider_order_id unique null, customer_id fk null, sku, amount_minor, currency, status [pending|paid|refunded|chargeback|expired], window_start, window_end, chart_id fk, created_at, updated_at)`
- `entitlements(id uuid pk, customer_id fk, chart_id fk null, sku, valid_from, valid_to null, source_order_id fk, revoked_at null)`
- `webhook_events(provider, event_id, received_at, primary key(provider, event_id))`: idempotencia.
- `magic_tokens(token_hash pk, email, expires_at, used_at)`
- `gifts(id, code_hash unique, sku, purchaser_customer_id, recipient_email, deliver_at, delivered_at, redeemed_at)` (P1)
- `email_optins(email, source, consent_version, created_at, confirmed_at)`

**Retención y borrado:** los datos de nacimiento se borran a pedido (flujo por email, A2-7); los `magic_tokens` se purgan a los 7 días; las órdenes `pending` (y sus datos cifrados) se purgan a las 48 h si no se pagan. **No se guarda nada más** de quien no compra ni da opt-in.

### 5.2 Contratos (A0 los publica en `docs/v1/CONTRACTS.md` antes de la Oleada 2)

```ts
// Catálogo único: frontend/lib/billing/catalog.ts
type Sku = "year_map" | "year_map_next" | "year_map_gift" | "extra_map" | "plus_monthly" | "plus_yearly";
interface Product {
  sku: Sku; kind: "one_time" | "subscription";
  window: "rolling12" | "next_calendar_year" | "none";
  prices: Partial<Record<"USD" | "CLP", number>>;   // unidades menores (CLP sin decimales)
  enabled: boolean; activeFrom?: string; activeTo?: string; // "MM-DD" para year_map_next
}

// Adaptador de cobro: frontend/lib/billing/provider.ts
interface BillingProvider {
  id: "stripe" | "lemonsqueezy" | "mercadopago" | "mock";
  enabled(): boolean;
  createCheckout(i: { orderId: string; sku: Sku; currency: "USD" | "CLP"; email?: string;
    locale: "es" | "en"; successUrl: string; cancelUrl: string }): Promise<{ url: string }>;
  verifyAndParseWebhook(req: Request): Promise<BillingEvent | null>; // null = evento ignorado
}
interface BillingEvent { eventId: string; type: "paid" | "refunded" | "chargeback";
  orderId: string; providerOrderId: string; email: string; amountMinor: number; currency: string; }
```

**Rutas nuevas del frontend:**

| Ruta | Entrada | Salida y reglas |
|------|---------|-----------------|
| `POST /api/billing/checkout` | `{sku, birth: BirthData & {tz_name}, email?, locale, ref?, ph_id?}` | `{url}`. Crea la orden `pending` con los datos cifrados y deja la cookie HttpOnly `ae_pending_order`. |
| `POST /api/billing/webhook/[provider]` | — | Firma verificada, idempotencia y fulfillment: customer, chart, entitlement y email con acceso. Reembolso o contracargo → revocación. |
| `GET /api/billing/status` | — | `{mode: "live" \| "waitlist" \| "dev", provider, currency}` |
| `GET /api/pro/order-status` | — | Solo con `ae_pending_order`. Cuando la orden figura como `paid`, emite la cookie de sesión. |
| `POST /api/auth/magic-link` | `{email}` | Siempre 204 (no revela si el email existe); rate limit por email e IP. |
| `GET /api/auth/verify?token=` | — | Cookie `ae_session` (HttpOnly, Secure, SameSite=Lax, 30 días) y redirect a `/mis-mapas`. |
| `POST /api/auth/logout` | — | — |
| `GET /api/pro/entitlements` | — | `[{sku, chart_id, window_start, window_end}]` (requiere sesión) |
| `POST /api/pro/year-map` | `{chart_id}` | `YearMapContent v2` solo con derecho vigente: 403 si no hay derecho. |
| `GET /api/pro/year-map.ics?chart_id=` | — | iCal con las fechas clave (requiere derecho). |
| `GET /api/places?q=&lang=&limit=` | — | Proxy al backend con caché pública de 1 día. |

**`YearMapContent v2`** (extiende el actual de `lib/year-map.ts`):

```ts
window: { start: "YYYY-MM"; end: "YYYY-MM"; kind: "rolling12" | "calendar" }
// months[i].key cruza el año; el label incluye el año ("Oct 2026")
keyDates: { date: "YYYY-MM-DD"; endDate?: string; title: string; areas: TopicId[];
            tone: "tenso" | "armonico" | "neutro"; why?: string;
            technical?: { transit: string; aspect: string; natal: string } }[]
climateMode: "relative"
```

**Cambios del backend:**
- `POST /api/chart` acepta `tz_name` opcional y devuelve `tz_name`, `utc_offset_used` y `tz_warning`.
- Nuevo `GET /api/places`.
- `POST /api/transits` devuelve `key_events`: eclipses y lunaciones que tocan puntos natales con orbe ≤ 3°, reutilizando `find_eclipses` (`astro/mundane.py`) y la lógica de fases de `astro/calendar.py`. También expone `raw_intensity` sin recortar en cada mes.

---

## §6. EQUIPO MULTIAGENTE

### 6.1 Roles

| Agente | Misión | Entregables principales |
|--------|--------|-------------------------|
| **A0 Orquestador / Tech Lead** | Plan, contratos, integración, gates y documentación | `docs/v1/{PLAN,CONTRACTS,DECISIONS,RISKS,STATUS}.md`, merges a `release/v1-comercial`, actualización de `CLAUDE.md`, `AGENTS.md` y `DEPLOY.md`, notas de versión |
| **A1 Plataforma y SRE** | Dependencias, build, contenedores, deploy, CI | Next 16 + React 19, backend actualizado, efemérides, workers, `render.yaml`/`vercel.json`, pipeline de CI completo, `docs/v1/PERF.md` |
| **A2 Seguridad y cumplimiento** | Superficie de ataque, privacidad, legal, licencias | Proxy firmado, límites de entrada, rate limit en el borde, CSP, allowlists, páginas legales, LICENSE/NOTICE, flujo de borrado de datos |
| **A3 Motor astrológico** (backend) | Precisión y datos | `/api/places` (GeoNames), zona horaria en servidor, Quirón, `key_events`, `raw_intensity`, caché, tests de precisión |
| **A4 Pagos y entitlements** | Que el dinero entre y el cliente reciba lo suyo | DB, catálogo, adaptadores, checkout, webhook, magic link, `/api/pro/*`, emails transaccionales, regalos (P1) |
| **A5 Producto Pro y UX** (frontend) | Que comprar sea obvio y deseable | Paywall nuevo, `/pro`, `/pro/gracias`, `/mis-mapas`, año móvil, gating de `/transitos`, formulario con places y zona, contraste |
| **A6 Contenido e interpretación** (ES/EN) | Que el texto valga lo que cuesta | Modelo de clima relativo, meses anclados a fechas, sin duplicados, concordancia de género, disclaimers, copy de paywall, `/pro`, emails y legales. **Única puerta de `es.ts`/`en.ts`.** |
| **A7 Crecimiento, SEO y analítica** | Medir y traer tráfico | Taxonomía de eventos, PostHog, dashboards, tarjetas para compartir, referidos, SEO técnico, opt-in de email |
| **A8 QA y Red Team** | Que nada se rompa y nada se pueda robar | Playwright (desktop/móvil, ES/EN, oscuro/claro), Vitest, axe, prueba de carga, revisión adversarial de todo PR que toque dinero, auth o seguridad |

### 6.2 Propiedad de archivos (evita conflictos)

| Zona | Dueño | Notas |
|------|-------|-------|
| `backend/astro/**`, `backend/scripts/**`, `backend/data/**` | A3 | A2 revisa las validaciones de `models.py` |
| `backend/main.py` | A2 (middleware, secreto, rate limit, límites) · A3 (endpoints) | Editan secciones distintas; A0 resuelve conflictos |
| `backend/Dockerfile`, `render.yaml`, `docker-compose.yml`, `.github/workflows/**` | A1 | |
| `frontend/package.json`, `tsconfig.json`, ESLint, `vercel.json`, `next.config.mjs` | A1 | El bloque CSP de `next.config.mjs` es de A2 |
| `frontend/lib/backend-proxy.ts`, `frontend/lib/api-fetch.ts` | A2 | |
| `frontend/app/api/{billing,auth,pro}/**`, `frontend/lib/{billing,db,email,auth}/**` | A4 | |
| `frontend/lib/{year-map,pro-human,tier-minus1,topic-summary,personal-intensity,interpretation-engine,natal-interpretations,brief-summary}.ts` | A6 | |
| `frontend/lib/locales/es.ts`, `en.ts` | **A6, en exclusiva** | Los demás piden claves en `docs/v1/i18n-requests.md` o en la descripción de su PR; A6 las integra |
| `frontend/components/**`, `frontend/app/{carta,pro,mis-mapas,nueva,transitos,retorno}/**` | A5 | `BirthDataForm` consume los contratos de A3 |
| `frontend/app/(legal)/**` | A2 | Copy de A6 |
| `frontend/lib/{analytics,learning,site}.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/**/opengraph-image*` | A7 | `site.ts` coordinado con A1 |
| `frontend/e2e/**`, configuración de Vitest y Playwright | A8 | Cada agente escribe los tests de su propio código |
| `CLAUDE.md`, `AGENTS.md`, `DEPLOY.md`, `README.md`, `docs/v1/**` | A0 | |

### 6.3 Protocolo de coordinación

1. **Contrato primero:** A3 y A4 publican sus contratos (§5.2) antes de que A5 los consuma. Mientras tanto, A5 trabaja con fixtures o mocks.
2. **PRs chicos** (idealmente < 400 líneas de diff) hacia `release/v1-comercial`. Todo PR que toque dinero, autenticación, datos personales o seguridad lleva revisión adversarial de A8.
3. **Integración continua:** después de cada merge, A0 corre todos los gates (§8) sobre la rama de integración, y cada agente trae esa rama a la suya antes de seguir.
4. **Conflictos:** si dos agentes necesitan el mismo archivo, aplica el cambio el dueño de ese archivo y el otro deja el parche en su PR.
5. **Decisiones de diseño críticas** (zona horaria, intensidad, entitlements, webhook): dos agentes proponen alternativas, A8 critica y A0 decide. La decisión queda en `docs/v1/DECISIONS.md`.
6. **Estado vivo:** cada agente actualiza `docs/v1/STATUS.md` al cerrar cada tarea.

### 6.4 Cómo aprovechar Grok 4.7 al máximo

- **Paralelismo real:** si tu entorno permite sub-agentes en paralelo, lanza uno por rol con su sección como brief y la tabla §6.2 como frontera. Si no, ejecuta los roles en secuencia, oleada por oleada, sin saltarte los gates.
- **Contexto largo:** carga completos `AGENTS.md`, `CLAUDE.md`, `DEPLOY.md`, este SPEC y los archivos citados en tus hallazgos antes de proponer cambios.
- **Herramientas:** ejecución de código y terminal para correr tests (no afirmes que algo pasa sin ver la salida); búsqueda web para verificar precios, políticas y APIs de proveedores (con cita); navegador o Playwright para verificar la UI con capturas.
- **Razonamiento al máximo** en: zona horaria y horario de verano, normalización de intensidad, idempotencia del webhook, seguridad de entitlements y sesiones, y la migración a Next 16.
- **Autoverificación:** antes de declarar una tarea terminada, A8 intenta romperla (inputs extremos, replay del webhook, manipulación de cookies y localStorage, IPs falsas).

---

## §7. PLAN POR OLEADAS

Prioridad si te quedas sin tiempo o contexto (en este orden): H-01/H-02 → H-03/H-04/H-05/H-06 → H-12/H-14 (sin desbloqueo gratis, entitlements) → H-21/H-22/H-25 (valor del Pro) → H-18/H-19/H-20 (precisión) → legal (H-16/H-17) → analítica (H-15) → el resto.

### Oleada 0: descubrimiento y contratos (solo lectura, todos en paralelo)

- **A0:** crea `release/v1-comercial` y el esqueleto `docs/v1/`; corre la línea base (Anexo B) y registra los resultados.
- **Cada agente** escribe `docs/v1/agents/A<N>.md` con: hallazgos de su área confirmados o refutados (con `archivo:línea`), plan de tareas, riesgos y preguntas.
- **A0** consolida `PLAN.md`, `CONTRACTS.md` (§5.2 refinado) y `DECISIONS.md` (D1–D11 con el valor efectivo).
- **🛑 Gate 0:** el dueño confirma D1, D2, D3 y D11 (o acepta los defaults de las demás). Sin D1, la Oleada 2 se implementa completa con el adaptador de Stripe más un adaptador simulado (`mock`) para tests, y el modo `waitlist` en producción.

### Oleada 1: listo para producción (P0 técnico)

**A1 · Plataforma**

- **A1-1 · Frontend:** Next 16.3.x + React 19; quitar `d3` y `@types/d3`; ESLint 9 (flat config) con `npm run lint`; `npm run typecheck` (`tsc --noEmit`); `engines` + `.nvmrc` (Node 20.9+); arreglar el build (alias de @react-pdf para Turbopack o `--webpack`).
  - **Aceptación:** build OK; los 3 PDFs se generan (E2E); `npm audit --omit=dev` sin high/critical.
- **A1-2 · Backend:** pins de H-02 + `tzdata`; endpoints de cómputo fuera del event loop; semáforo; timeout de 30 s por cómputo; `GZipMiddleware`; `WEB_CONCURRENCY` configurable; uvicorn con `--proxy-headers` solo si hace falta (la IP real viene firmada desde el proxy, H-05).
  - **Aceptación:** test con uvicorn real, `/health` p95 < 200 ms con un cómputo pesado en curso; pytest verde.
- **A1-3 · Efemérides:** el Dockerfile descarga `sepl_18.se1`, `semo_18.se1` y `seas_18.se1` desde el repositorio oficial de Astrodienst y verifica el SHA-256 (Anexo C); el arranque registra si usa SWIEPH o Moshier.
  - **Aceptación:** test de 12 cuerpos con Quirón; `verify_corpus` 54/54.
- **A1-4 · Deploy:** `render.yaml` con `plan: starter`, `region` decidida con medición y health check en `/health`; `vercel.json` sin URLs duplicadas (las toma de `lib/site.ts` y las env); retirar `keepalive.yml` cuando el plan sea pago (antes, documentar el límite de 60 días de inactividad).
- **A1-5 · CI:** jobs `backend` (pytest, verify_corpus, pip-audit), `frontend` (lint, typecheck, vitest, check:i18n, check:interp, build, npm audit), `e2e` (Playwright contra el build y el backend levantado en el job) y `secrets` (gitleaks u otro equivalente).
  - **Aceptación:** checks requeridos en PRs hacia `main`.
- **A1-6 · Configuración:** guard de `next.config.mjs` solo con `VERCEL_ENV=production` (H-09); `lib/site.ts` con `SITE_URL` reemplazando los 6 orígenes hardcodeados (H-10), coordinado con A7.

**A2 · Seguridad y cumplimiento**

- **A2-1 · Proxy firmado:** `X-Astro-Proxy-Key` + `X-Astro-Client-IP` en `lib/backend-proxy.ts`; middleware en el backend (403 sin secreto en producción, excepto `/health`); `key_func` con la IP firmada; `/health` sin rate limit.
  - **Aceptación:** tests de H-05 y H-06.
- **A2-2 · Límites de entrada:** `natal_planets` 1..20, largos de strings, body ≤ 64 KB, coordenadas válidas, rango de fechas; arreglar `strip_whitespace` (H-29).
  - **Aceptación:** test de H-03 (400 planetas → 422 rápido).
- **A2-3 · Rate limit en el borde** para `/api/chart`, `/api/transits`, `/api/places`, `/api/billing/checkout` y `/api/auth/magic-link` (más estricto: 3/hora por email y 10/hora por IP). Debe responder 429 con `Retry-After` y la UI lo debe manejar.
- **A2-4 · CSP y headers:** nonce o hash para `THEME_BOOT`, sin `unsafe-eval` (`'wasm-unsafe-eval'` solo si los PDFs lo exigen), `next/font` local, `connect-src` mínimo, HSTS con dominio propio y `Cross-Origin-Opener-Policy`.
  - **Aceptación:** sin violaciones de CSP en la consola durante el E2E completo, PDFs incluidos.
- **A2-5 · Allowlist de orígenes** para success y cancel del checkout (H-07). Revisión del código de A4.
- **A2-6 · Licencias según D2:** `LICENSE` y/o `NOTICE`, enlace "Código fuente" en el footer si D2 = AGPL, y atribuciones de GeoNames (CC BY 4.0) y de las fuentes OFL.
- **A2-7 · Legales en ES/EN** bajo `app/(legal)/`:
  - `/terminos`, `/privacidad` (reescrita), `/reembolsos` (garantía de 14 días, cómo pedirla, plazos) y `/contacto` (email de soporte).
  - Componente `<Disclaimer/>` en `/carta`, en el panel Pro y en los PDFs: orientación y entretenimiento; no reemplaza consejo médico, psicológico, financiero ni legal.
  - Flujo de solicitud de acceso, rectificación y borrado por email.
  - La privacidad cubre:
    - Responsable (placeholders D11).
    - Finalidades y base legal.
    - Datos tratados: nacimiento, email y datos de pago, estos últimos en manos del proveedor.
    - Encargados: Vercel, Render, Neon, Resend, el proveedor de cobro, PostHog y Sentry.
    - Transferencias internacionales.
    - Plazos de retención.
    - Derechos (acceso, rectificación, supresión, oposición, portabilidad).
    - El enlace de compartir (H-31).
    - Contacto.

  Texto **sin** identidad inventada. **🛑** El dueño revisa (idealmente con un abogado) antes de publicar.

**A3 · Motor astrológico**

- **A3-1 · `/api/places`:**
  - Script `backend/scripts/build_places.py` que descarga GeoNames `cities5000` (+ `countryInfo`) y genera `backend/data/places.tsv.gz`, versionado y con fecha y licencia en `backend/data/README.md`, para tener builds deterministas.
  - Índice en memoria normalizado (minúsculas, sin acentos; `name`, `asciiname` y los `alternatenames` en alfabeto latino).
  - Búsqueda por prefijo con ranking exacto > prefijo > población. Devuelve `{id, name, admin1, country_code, country_name(lang), lat, lon, tz, population}`.
  - **Aceptación:** "santiago", "nueva york" y "punta arenas" devuelven la zona correcta; memoria extra < 120 MB (medida); p95 < 30 ms.
- **A3-2 · Zona horaria en servidor:** `tz_name` en `POST /api/chart`; offset con `zoneinfo` en la hora local exacta; horas inexistentes o ambiguas resueltas con `fold` y un `tz_warning` legible; `timezone_offset` se mantiene como override manual.
  - **Aceptación:** tests de casos históricos con resultado verificado contra `zoneinfo`: Santiago invierno 1990 (−4) y verano (−3), Punta Arenas 2018 (−3), Seúl (+9), Dublín en verano (+1), Phoenix sin horario de verano (−7), Kolkata (+5:30), Katmandú (+5:45) y Caracas 2010 (−4:30).
- **A3-3 · `key_events` y `raw_intensity`** en `/api/transits` (§5.2).
  - **Aceptación:** cada evento, recomputado de forma independiente en el test, cae dentro de ±1 día y ≤ 3°.
- **A3-4 · Caché:** LRU de tránsitos por huella de longitudes redondeadas y rango; `Cache-Control` en `/api/places`.
- **A3-5 · Golden tests de precisión** para las 3 cartas de validación de `CLAUDE.md` con efemérides `.se1`, tolerancia de 0,05°. Documenta la fuente de los valores esperados.

### Oleada 2: un Pro que se vende (P0 comercial)

**A4 · Pagos y entitlements**

- **A4-1 · Base de datos:** Neon + Drizzle (esquema §5.1, migraciones, `lib/db`); helpers de cifrado (AES-256-GCM) y de huella (HMAC); variables `DATABASE_URL`, `DATA_ENC_KEY`, `CHART_PEPPER` y `SESSION_SECRET`.
- **A4-2 · Cobro:** catálogo único (§5.2) más la interfaz `BillingProvider`, con adaptadores `stripe` (portado desde `lib/stripe-server.ts`), el elegido en D1 (`lemonsqueezy` y/o `mercadopago`) y `mock` (tests y E2E). Antes de escribir el adaptador real, A4 redacta para el dueño el mensaje de consulta al proveedor ("¿aceptan reportes astrológicos personalizados generados por software, entregados como web + PDF?") y no lo activa sin la respuesta afirmativa por escrito. El mapeo SKU → id de precio del proveedor va en env (`PROVIDER_PRICE_IDS` en JSON).
- **A4-3 · Checkout:** orden `pending` con los datos cifrados, cookie `ae_pending_order`, URLs de la allowlist, moneda por país y email opcional (el proveedor lo pide).
- **A4-4 · Webhook:**
  - Firma verificada, `webhook_events` para idempotencia y fulfillment transaccional.
  - Email con acceso (magic link) y recibo del proveedor.
  - Reembolso o contracargo → `revoked_at` y aviso por email.
  - Logs estructurados `billing.*` y alerta en Sentry si algo falla.
- **A4-5 · Autenticación ligera:** magic link (token de 32 bytes, se guarda su SHA-256, vence en 20 min, un solo uso), cookie de sesión firmada y cifrada, logout. Evalúa con búsqueda web si conviene una librería mantenida (Better Auth, Auth.js u otra) frente a la implementación mínima, y documenta la elección en `DECISIONS.md`.
- **A4-6 · Pro servido desde el servidor:**
  - `POST /api/pro/year-map` comprueba el derecho, pide tránsitos y retorno al backend (proxy firmado) y genera `YearMapContent v2` con módulos `server-only`.
  - El cliente solo renderiza JSON.
  - La muestra "Alex Rivera" pasa a un módulo propio, liviano, para que la lógica Pro salga del bundle del cliente.
  - Endpoint `.ics`. PDF en servidor (P1): mientras tanto, el cliente genera el PDF desde el JSON autorizado.
- **A4-7 · `PRO_MODE`** (H-12): elimina el desbloqueo "soft" en `live` y `waitlist`.
  - **Aceptación:** test de que, sin derecho, ningún camino muestra contenido Pro en `live`/`waitlist`, incluso con `astro_pro_*` falsificado en localStorage.
- **A4-8 · Emails** (Resend + React Email; copy de A6): magic link, acceso tras la compra, confirmación de opt-in (doble) y reembolso. P1: recordatorio mensual por Vercel Cron el día 1 y entrega de regalos.
- **A4-9 (P1) · Regalos:** `year_map_gift` con email del destinatario, `deliver_at` y canje.

**A5 · Producto Pro y UX**

- **A5-1 · Paywall nuevo (§4.4):** componente `ProOffer` que reemplaza el bloque no-Pro de `TopicSummarySection`.
  - Los datos del teaser se calculan con `/api/transits` en diferido, cuando el panel entra en viewport o a los 10 s, y se cachean. Esos mismos datos se reutilizan si el usuario compra.
  - **Aceptación:** dos cartas distintas muestran teasers distintos; ninguna cadena de mes queda fija en el código.
- **A5-2 · `/pro`:** landing indexable renderizada en servidor con propuesta de valor, muestra rotulada, tabla de precios del catálogo, garantía y FAQ. Testimonios **solo si son reales** y consentidos; si no, la sección no existe.
- **A5-3 · Año móvil:** meses con su año ("Oct 2026 … Sep 2027") y, de noviembre a enero, selector "Próximos 12 meses / Tu 2027".
- **A5-4 · `/pro/gracias`:** consulta `order-status` cada pocos segundos (con timeout y un mensaje claro si tarda), desbloqueo, PDF, `.ics`, "Revisa tu email", tarjeta para compartir y CTA de regalo.
- **A5-5 · `/mis-mapas`:** pedir el magic link, listar derechos y restaurar la carta en este dispositivo. El enlace aparece en el nav cuando hay sesión.
- **A5-6 · Gating:** `/transitos/[id]` muestra gratis solo el mes actual más un upsell; con Mapa del Año, los 12 meses de su ventana; con Plus (flag), 5 años. Ajustar los botones de "Cartas guardadas" en `/nueva`.
- **A5-7 · Contraste:** barrido de los usos de clases claras (H-28: 51 de `text-slate-900`/`bg-white` en 19 archivos; revisar los 183 de la familia clara), reemplazados por tokens, más test axe en las páginas principales en ambos temas.
- **A5-8 · `BirthDataForm`:** usa `/api/places` (debounce de 250 ms, cancelar la petición anterior, teclado accesible), muestra la zona resuelta ("America/Santiago · UTC−4 en esa fecha") con opción de editarla, y el modo manual para coordenadas + zona. Con "hora desconocida", avisar que el Ascendente y las casas no son fiables y que la lectura se apoyará en los signos.

**A6 · Contenido**

- **A6-1 · Clima relativo (H-21):**
  - Ordenar los 12 meses por `raw_intensity` (z-score robusto con mediana y MAD).
  - **apretado** = top 3 o z ≥ +1 con mayoría de aspectos tensos; **suave** = bottom 3 o z ≤ −1; **abierto** = el resto, matizado por la proporción armónica.
  - Si la serie es plana, decirlo con honestidad ("año parejo").
  - El gráfico muestra la intensidad relativa a tu año (mínimo → 2, máximo → 9), rotulada así.
  - **Aceptación:** test sobre 50 cartas aleatorias: ≥ 2 meses de cada clima en ≥ 90 % de ellas, y el promedio de meses "apretado" entre 15 % y 45 %.
- **A6-2 · Meses anclados a eventos:**
  - Cada mes nombra de 1 a 3 eventos reales traducidos a áreas de vida, con fechas ("del 3 al 18: conversaciones de pareja más serias"), más "qué hacer" y "qué evitar".
  - Las fechas clave salen de `exact_date`, `enters_orb`/`leaves_orb`, `key_events` y `retro_periods`.
  - Por defecto sin jerga, con "ver detalle técnico" opcional (la marca habla de ingeniería).
  - **Aceptación:** test de que ninguna oración se repite dentro de un mismo mapa, en 20 cartas aleatorias.
- **A6-3 · Concordancia de género (H-25):** `VOICE[sign].es.style` pasa a `{ f, m }` o se reescriben las frases; el test genera los 12 signos × (presencia, clima, tono) y valida la concordancia.
- **A6-4 · Copy** del paywall, `/pro`, los emails, los legales (con A2) y los estados de error, en ES/EN. Precios **siempre** desde el catálogo con `t(key, {price})`. `check-i18n` valida la paridad de placeholders.
- **A6-5 · Disclaimers** en Salud y Dinero, y la guía de tono `docs/v1/TONO.md`: segunda persona, frases cortas, nada determinista ("vas a…"), nada médico ni financiero.

**A7 · Crecimiento y analítica**

- **A7-1 · Analítica:**
  - `lib/analytics.ts` con la taxonomía de §4.6 y PostHog sin cookies (persistencia en memoria, sin grabación de sesiones).
  - Captura de UTM y `ref`.
  - `purchase_completed` y `refund_issued` desde el webhook, con id anónimo enlazado por metadata (`ph_id`).
  - `trackLearning` pasa a envolver `track` (se conservan los nombres de evento).
  - Dashboards documentados en `docs/v1/ANALYTICS.md`.
- **A7-2 · Opt-in de email** (waitlist, PDF gratis y "tu mes") con consentimiento explícito y doble confirmación, guardado en `email_optins`.
- **A7-3 · SEO técnico:** metadata por página, imágenes OG, sitemap con `/pro` y las páginas legales, `robots.ts`, JSON-LD (Organization; Product con offers del catálogo; FAQPage) y canonical desde `SITE_URL`.

### Oleada 3: crecimiento y retención (P1/P2)

1. Tarjetas para compartir (`next/og`) y referidos (`?ref=` → cupón del proveedor).
2. Regalos completos y recordatorio mensual (si no entraron en la Oleada 2).
3. Plus detrás de flag (solo si se cumple el go/no-go de §4.3).
4. Sinastría: endpoint, corpus y SKU.
5. Páginas SEO desde el backend del calendario archivado (D9).
6. Rutas `/en` con `hreflang`.
7. Adaptador de Mercado Pago (CLP) si D1 lo incluye.
8. PDF en servidor y envío adjunto por email.

### Oleada 4: endurecimiento y lanzamiento

- **A8:** regresión completa (§8); prueba de carga (k6 o Locust: 20 usuarios concurrentes creando cartas + 5 tránsitos/min durante 10 min; `/health` p95 < 200 ms; cero 5xx); red team final.
- **A1:** entorno de staging (preview de Vercel + servicio de staging en Render + rama de DB en Neon); prueba de backup y restore de la base.
- **A0:**
  - Actualiza `CLAUDE.md` (estado real, Pro, arquitectura nueva), `AGENTS.md` (este SPEC como referencia) y `DEPLOY.md` (variables, webhooks, runbook, rollback).
  - Escribe `docs/v1/RELEASE_NOTES.md`.
  - Abre el PR `release/v1-comercial → main`.
  - **🛑** El dueño aprueba el merge y el encendido de `PRO_MODE=live`.

---

## §8. GATES DE CALIDAD (Definition of Done)

**En cada PR** (los scripts `lint`, `typecheck` y `test` los crea A1 en la Oleada 1; hasta entonces corre los existentes):

```bash
# backend
pytest backend/tests
(cd backend && python scripts/verify_corpus.py)          # 54/54 PASS
pip-audit -r backend/requirements.txt                    # sin high/critical
# frontend
cd frontend && npm ci && npm run lint && npm run typecheck && npm run test \
  && npm run check:i18n && npm run check:interp && npm run build
npm audit --omit=dev                                     # sin high/critical
npx playwright test                                      # desktop 1440×900 + móvil 390×844, ES/EN
```

- Sin errores de consola propios de la app y sin violaciones de CSP.
- Capturas de toda UI que cambió: desktop y móvil, ES/EN, tema oscuro y claro.
- `DEPLOY.md` y `.env.example` actualizados si hay variables nuevas.

**Invariantes de dinero** (tests obligatorios, A8 los revisa):

1. Sin derecho vigente, el servidor nunca devuelve contenido Pro (403), aunque el localStorage diga lo contrario.
2. El webhook es idempotente: reenviar el mismo evento no duplica derechos, órdenes ni emails.
3. Un reembolso o contracargo revoca el derecho.
4. El magic link es de un solo uso, expira y no revela si un email existe.
5. Success y cancel del checkout solo apuntan a orígenes de la allowlist.
6. Los precios salen solo del catálogo: no hay "$" hardcodeado en la UI ni en las locales (lo verifica un test con grep).
7. Ningún log, evento ni breadcrumb contiene datos de nacimiento ni emails en claro.

**Presupuestos:**
- `/carta/[id]` First Load JS ≤ 200 kB.
- LCP móvil ≤ 2,5 s en la landing (Lighthouse en staging).
- `/api/chart` p95 < 1,5 s y `/api/transits` p95 < 4 s en Render Starter.

---

## §9. FORMATO DE REPORTE

**Cada agente, por tarea:**

```
## [A<N>] <ID tarea> — <título> — <HECHO | EN CURSO | BLOQUEADO 🛑>
- Hallazgos confirmados/refutados: H-xx (archivo:línea, evidencia)
- Cambios: <archivos>
- Verificación: <comandos> → <resumen de salida real>
- Capturas: <rutas>
- Riesgos / deuda: …
- Siguiente paso / qué necesito del dueño: …
```

**El orquestador, al final de cada oleada:** checklist de H-xx resueltos, estado de S1–S10, métricas (auditorías, rendimiento, bundle), riesgos abiertos y lo que necesita del dueño (con 🛑).

---

## §10. RUNBOOK HUMANO (lo hace el dueño; Grok prepara los textos y los checklists)

1. **Decisiones** D1, D2, D3 y D11 (Gate 0).
2. **Cuentas:**
   - Vercel Pro y Render Starter.
   - Neon y Resend (con el dominio: registros SPF, DKIM y DMARC).
   - El proveedor de cobro elegido. Antes de abrir la cuenta, confirmar por escrito que acepta el producto (Paddle lo prohíbe; Lemon Squeezy y Mercado Pago hay que preguntarlos). La verificación de identidad pide las páginas legales publicadas y un email de soporte.
   - PostHog y Sentry.
3. **Dominio:** conectarlo en Vercel y actualizar `SITE_URL` (Vercel) y `FRONTEND_URL` (Render).
4. **Variables de entorno:**
   - Vercel: `SITE_URL`, `BACKEND_URL`, `BACKEND_PROXY_KEY`, `DATABASE_URL`, `DATA_ENC_KEY`, `CHART_PEPPER`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `BILLING_PROVIDER`, las credenciales del proveedor (API key, webhook secret, store o vendor id, `PROVIDER_PRICE_IDS`), `PRO_MODE`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (si se usa Upstash), `NEXT_PUBLIC_SENTRY_DSN`.
   - Render: `ENV=production`, `FRONTEND_URL`, `EPHE_PATH`, `BACKEND_PROXY_KEY`, `WEB_CONCURRENCY`, `SENTRY_DSN`.
5. **Productos y precios** creados en el proveedor según el catálogo; webhook apuntando a `https://<dominio>/api/billing/webhook/<provider>`.
6. **Pruebas reales:** compra completa en modo test → compra real chica → reembolso → verificar que se revoca → restaurar desde otro dispositivo.
7. **Legal:** completar los placeholders y revisar términos, privacidad y reembolsos, idealmente con abogado y contador (IVA/boletas si se vende con un proveedor local).
8. **Licencia** de Swiss Ephemeris si D2 = cerrado.
9. **Encender** `PRO_MODE=live` y monitorear 72 h: Sentry, salud del webhook, embudo y monitor de uptime externo sobre `/health` y `/api/billing/status`.

---

## §11. ANTIPATRONES PROHIBIDOS

- Desbloquear Pro en el cliente sin una verificación del servidor.
- Hardcodear precios, monedas u orígenes.
- Inventar testimonios, métricas, "precio antes", escasez o identidad legal.
- Afirmaciones deterministas o de salud y dinero ("vas a enfermar", "vas a ganar").
- Saltarse, marcar `skip` o debilitar tests; bajar la precisión; romper `verify_corpus`.
- Datos de nacimiento o emails en logs, analítica, Sentry o URLs nuevas.
- Dependencias pesadas sin justificación; superar el presupuesto de bundle.
- Push a `main`, force-push o reescribir historia compartida.
- Declarar algo "listo" sin pegar la salida real de los comandos que lo prueban.

---

## §12. PRIMEROS PASOS (empieza ya)

```bash
git fetch origin
# Este SPEC vive en el branch claude/nifty-planck-13n6j3 (= main + este documento).
# Si ya se fusionó a main, parte de origin/main en vez de ese branch.
git checkout -b release/v1-comercial origin/claude/nifty-planck-13n6j3
git merge origin/main   # por si main avanzó después
# Línea base (Anexo B): backend
python -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt pytest pip-audit
pytest backend/tests -q && (cd backend && python scripts/verify_corpus.py) && pip-audit -r backend/requirements.txt
# Línea base: frontend
cd frontend && npm ci && npm run check:i18n && npm run check:interp && npm run build && npm audit --omit=dev; cd ..
```

Luego lanza la **Oleada 0** (todos los agentes en paralelo, solo lectura) y entrega su consolidado antes de tocar código.

---

## Anexo A — Fuentes (verificadas el 2026-10-05; vuelve a verificarlas antes de usarlas en copy público)

- Stripe, países soportados: https://stripe.com/global
- Swiss Ephemeris, precio de la licencia profesional: https://www.astro.com/swisseph/swephprice_e.htm · Código oficial y efemérides: https://github.com/aloistr/swisseph
- Política de uso de Nominatim: https://operations.osmfoundation.org/policies/nominatim/
- GeoNames, extractos (formato, zona IANA, licencia): http://download.geonames.org/export/dump/readme.txt
- Vercel Hobby (uso no comercial): https://vercel.com/docs/plans/hobby
- Render, frecuencia del health check (5 s): https://community.render.com/t/how-often-does-health-checks-happen/26175 · Precios de Render 2026: https://makerkit.dev/pricing-calculator/render
- Lemon Squeezy, comisiones y países: https://docs.lemonsqueezy.com/help/getting-started/fees · https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Lemon Squeezy, productos prohibidos: https://docs.lemonsqueezy.com/help/getting-started/prohibited-products · Stripe, negocios restringidos: https://stripe.com/legal/restricted-businesses
- Paddle, política de uso (prohíbe horóscopos, ítem 14): https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
- Ley 19.918 (deroga el art. 496 N°32 del Código Penal): https://chile.justia.com/nacionales/leyes/ley-n-19-918/gdoc/
- Mercado Pago Chile, comisiones (referencial): https://www.mercadolibre.cl/ayuda/33399
- Ley 21.719 (vigencia 2026-12-01): https://www.yourdevs.cl/blog/ley-21719-proteccion-datos-chile · https://araya.cl/ley-de-proteccion-de-datos-se-postergara-su-entrada-en-vigencia/
- Benchmarks:
  - Cafe Astrology: https://cafeastrology.com/futureforecastreports.html
  - astro.com: https://www.astro.com/prod/pr_forecast_e.htm
  - Comparativa de apps 2026: https://joinzodia.com/zodia-vs-co-star-vs-chani-vs-sanctuary-2026.html
  - Lectura humana en Chile: https://renaser.cl/lectura-carta-natal/lectura-carta_natal.html

## Anexo B — Mediciones de la auditoría (reproducibles)

| Medición | Resultado | Cómo reproducir |
|----------|-----------|-----------------|
| Línea base backend | pytest 88/88; verify_corpus 54/54 | `pytest backend/tests -q`; `cd backend && python scripts/verify_corpus.py` |
| Línea base frontend | check:i18n OK (479 claves); check:interp PASS; build OK | `npm run check:i18n && npm run check:interp && npm run build` |
| Auditoría npm | 4 vulnerabilidades (1 critical next, 2 high, 1 moderate); con next@16.3.8 + react@19: 0 | `npm audit --omit=dev`; en una copia: `npm i next@16.3.8 react@19 react-dom@19 --package-lock-only && npm audit --omit=dev` |
| Auditoría pip | 15 avisos; con los pins de H-02: 0 en las dependencias de la app y pytest 88/88 | `pip-audit -r backend/requirements.txt` |
| Tiempos (TestClient, 4 vCPU) | chart 17 ms · transits 12 meses ~1,1 s (120 KB) · solar-return 7 ms · calendar 149 ms · mundane 567 ms · RSS ~61 MB | Script con `fastapi.testclient` llamando a cada endpoint |
| DoS por `natal_planets` | 10 → 0,9 s · 100 → 8,7 s · 400 → 35,3 s | POST `/api/transits` con N planetas sintéticos |
| Event loop bloqueado | `/health` 8,0 s durante un `/api/transits` de 9 s | uvicorn real + 2 peticiones concurrentes |
| `/health` limitado | 429 "10 per 1 minute" con sondeo repetido | `curl` a `/health` más de 10 veces por minuto |
| Quirón | Sin `.se1`: 11 cuerpos. Con los `.se1` oficiales: 12 (Quirón 103,2341° para 1990-05-15 14:30 Santiago, UTC−4) | `EPHE_PATH=<dir>` + `calculate_natal_chart(...)` |
| Saturación de intensidad | 30 cartas: 98 % de los meses "apretado"; 30/30 con ≥ 10/12; 49 % en el techo; mediana de rango 2,6 | `calculate_transit_timeline` 2026 sobre cartas aleatorias (semilla 7) y clasificación con umbral ≥ 6,5 |
| Flujo real del Pro (Playwright) | El soft unlock muestra "Pago confirmado"; los 12 meses son variantes de "se aprieta"; teaser fijo "Marzo/Julio"; errores de concordancia | `/nueva?demo=1` → `/carta/[id]` → "Probar Pro 30 días" |
| Contraste en `/privacidad` | H1 `rgb(15,23,42)` sobre fondo `oklch(0.145 0.022 252)`: ilegible | Playwright + `getComputedStyle` |
| Producción en vivo | `/api/checkout/status` → `{"enabled":false}`; `/api/health` vía el frontend: 23,4 s (backend dormido) | `curl https://astro-engineering.vercel.app/api/checkout/status` y `/api/health` |

## Anexo C — Efemérides oficiales (SHA-256 verificados el 2026-10-05)

Origen: `https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/<archivo>`

| Archivo | Bytes | SHA-256 |
|---------|-------|---------|
| `sepl_18.se1` | 484061 | `ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66` |
| `semo_18.se1` | 1304771 | `1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7` |
| `seas_18.se1` | 223004 | `a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2` |

=== FIN DEL PROMPT ===
