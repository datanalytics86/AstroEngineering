# AstroEngine Pro — Guía de Sesión para Claude Code

## DESCRIPCIÓN DEL PROYECTO

Aplicación web de ingeniería astrológica profesional que calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, genera pronósticos de tránsitos planetarios (año actual por mes y próximos 4 años) y calcula retornos solares.

**Stack:**
- Backend: Python 3.11 + FastAPI + pyswisseph + slowapi
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS (SVG puro, sin D3)
- Deployment: Docker Compose (dev) → Vercel (frontend) + Render (backend, vía `render.yaml`)

---

## ESTADO ACTUAL DEL PROYECTO

> 2026-07-10 (b) — Calendario: estado del cielo (no solo eventos puntuales) vía "Tránsitos rápidos" y "Tránsitos lentos". **Bloque A — backend** (`astro/calendar.py`): cada día de `compute_daily_calendar` agrega `fast` (Luna, Sol, Mercurio, Venus, Marte al mediodía UT — signo, `degree_in_sign`, `retrograde` por velocidad longitudinal negativa); cada mes agrega `slow` (segmentos de signo de Júpiter/Saturno/Urano/Neptuno/Plutón dentro del mes, cortados en la fecha de ingreso si cambian de signo a mitad de mes — normalmente 1 segmento, 2 si hay ingreso — con `retrograde_mid` evaluado en el punto medio del segmento). Nuevos modelos `CalendarFastPos`/`CalendarSlowSegment` + campos `fast`/`slow` en `CalendarDay`/`CalendarMonth` (`astro/models.py`). 6 tests nuevos (`test_calendar.py`): 5 posiciones fast por día con signo válido y grado en `[0,30)`, signo recomputado coincide en 3 días muestreados, segmentos slow cubren el mes sin huecos por planeta, signo del segmento coincide con el recomputado en su punto medio, mes con ingreso lento tiene 2 segmentos para ese planeta. Suite completa 82/82 verde. **Bloque B — frontend**: tipos `CalendarFastPos`/`CalendarSlowSegment` (`lib/types.ts`), caché `astro_calendar_v1:` → `astro_calendar_v2:`. Panel de detalle del día reordenado: fecha → **"Tránsitos rápidos"** (Luna primero, luego Sol/Mercurio/Venus/Marte, con glifo, grado, chip ℞ y significado de una línea) → "Eventos del día" (como estaba) → disclaimer. Nuevo bloque de mes **"Tránsitos lentos (telón de fondo)"** bajo la grilla, encima de la leyenda (colapsable en móvil): los 5 planetas lentos con signo, fechas del segmento, chip ℞ si aplica y significado. `lib/calendar-corpus.ts`: `getFastTransitReading` (Luna reusa `LUNA_EN_SIGNO`; Sol/Mercurio/Venus/Marte generador composicional arquetipo × tono corto de signo, no 48 textos a mano) y `getSlowTransitReading` (`SLOW_CURATED` con textos de 1-2 frases para los 9 placements vigentes 2026-2027 verificados ejecutando el backend — Júpiter Cáncer/Leo, Saturno Aries/Piscis, Urano Tauro/Géminis, Neptuno Piscis/Aries, Plutón Acuario — tono mundano-generacional coherente con `/geopolitica`; generador de respaldo por elemento del signo para cualquier otro). Bug encontrado y corregido en Playwright: el proxy `app/api/calendar/route.ts` no pasaba `cache: "no-store"` al `fetch` al backend, así que Next.js cacheaba la primera respuesta (sin `fast`/`slow` si se pidió antes del rebuild) indefinidamente para esa URL; con `cache: "no-store"` el proxy siempre reenvía la respuesta fresca. i18n `cal.fast.title`, `cal.events.title`, `cal.slow.*` ES/EN en paridad exacta (302 claves). Verificado: pytest 82/82 verde, verify_corpus 54/54 PASS, check:i18n verde, `npm run build` pasa, Playwright confirma en desktop (1440×900) y móvil (390×844), ES/EN: el detalle del día muestra las 5 posiciones rápidas con significado y chips ℞ correctos, el bloque de tránsitos lentos del mes muestra los 5 lentos con fechas y significado (colapsable en móvil), los eventos siguen funcionando, CERO errores de consola propios de la app (solo ruido de sandbox: fuentes de Google bloqueadas).

> 2026-07-10 — Nuevo módulo "Calendario astrológico" (`/calendario`): resumen día a día del mes en curso + 2 siguientes. **Bloque A — backend**: nuevo `astro/calendar.py` con `compute_daily_calendar(year, month, months=3)`, reutiliza `to_julian_day`/`calc_planet_position`/`PLANET_IDS` de `chart.py`, `longitude_to_sign` de `houses.py`, `ASPECTS`/`angular_distance` de `aspects.py`, `compute_retrograde_periods` de `transits.py` y `find_eclipses` de `mundane.py` — sin duplicar astronomía. Por día (mediodía UT): posición de Luna (define el día) y Sol, más `events`: ingresos de signo de Sol→Marte y Luna (comparando signo de hoy vs ayer), fases lunares (cruce de elongación Luna-Sol por 0°/90°/180°/270°), estaciones de Mercurio/Venus/Marte, hasta 2 aspectos mayores exactos por día (orbe ≤1° y mínimo local, rápido-lento o rápido-rápido sin Luna) y eclipses. Nuevos modelos `CalendarDay`/`CalendarEvent`/`CalendarMonth`/`CalendarResponse` (`astro/models.py`). Endpoint `GET /api/calendar?year=&month=` (10/min, año validado 2020-2035, `months` fijo en 3). 6 tests nuevos (`backend/tests/test_calendar.py`): conteo de días por mes, la Luna cambia de signo 34-44 veces en 3 meses (aritmética: ciclo ~27.3 días / 12 signos ≈ 2.275 días/signo × ~90 días — nota: la estimación original de la especificación, 10-16, era incorrecta y se corrigió tras verificar contra el cálculo real), 3-5 fases lunares por mes en orden cíclico, todo ingreso con signo recomputado distinto al día anterior, todo aspecto con orbe recomputado ≤1.2°, endpoint 200 OK + año fuera de rango → 422. Suite completa 77/77 verde. **Bloque B — frontend**: ruta `/calendario` (`app/calendario/page.tsx` + `layout.tsx` con metadata SEO) + proxy `app/api/calendar/route.ts` (mismo patrón defensivo de cold start que el resto, `getWithWakingRetry` nuevo en `lib/api-fetch.ts`); acento teal/cyan (`#0D9488`) para diferenciarlo de azul/índigo/ámbar. UI: tabs de los 3 meses, grilla mensual CSS grid (7 columnas lun-dom) con glifo de signo lunar + iconos de eventos por celda, hoy resaltado con anillo, panel de detalle del día (default: hoy) con lectura breve por evento; en móvil (`<sm`) fallback a lista vertical de días con eventos (los sin eventos colapsados tras "Ver días sin eventos"). `lib/calendar-corpus.ts` (nuevo, bilingüe): `LUNA_EN_SIGNO` (12), `FASE_LUNAR` (4), `INGRESO_RAPIDO` (Sol/Mercurio/Venus/Marte × elemento, 16), estaciones reutilizando `retro-meanings.ts`, aspectos rápido-lento por composición genérica de arquetipos (no 200 textos), eclipses reutilizando `getEclipseNarrative` de `mundane-corpus.ts`. `lib/types.ts` con tipos del calendario; `lib/storage.ts` con caché `astro_calendar_v1:{year}_{month}`. Enlace "Calendario" en `NavHeader`, tarjeta puente en `/geopolitica` (bajo bibliografía) y en `/transitos/[id]` (junto a la orientación), 5ª tarjeta en la portada (grilla `lg:grid-cols-5`). i18n `cal.*` ES/EN en paridad exacta (326 claves). **Bloque C — pulido UX**: leyenda de iconos bajo la grilla; navegación por teclado en la grilla (roving tabindex, flechas mueven el foco, Enter/Espacio seleccionan); `motion-reduce:transition-none` en las celdas; `aria-label` por celda ("2 Luna en Acuario, 1 eventos"); above-the-fold en 1440×900 con tabs + grilla completa + inicio del panel de detalle visibles; franja "Hoy · Luna en X · evento" arriba de la grilla, clic selecciona hoy. Verificado: pytest 77/77 verde, verify_corpus 54/54 PASS, check:i18n verde, `npm run build` pasa, Playwright confirma en desktop (1440×900) y móvil (390×844), ES/EN: hoy resaltado y seleccionado por defecto, cambio de mes funciona, clic en día con evento muestra su lectura, navegación por flechas funciona, los puentes desde `/geopolitica` y la portada navegan correctamente a `/calendario`, y CERO errores de consola propios de la app (solo ruido de sandbox: `ERR_CONNECTION_RESET` de fuentes de Google bloqueadas).

> 2026-07-07 — Alineamientos multi-planeta (kind="alignment") + Tier 1 de UX en Geopolítica (overview, recorrido de página, accesibilidad). **Bloque A — backend**: nueva `find_alignments(configurations, start, end)` en `astro/mundane.py`, post-proceso sobre las configs `kind=="aspect"` ya detectadas: agrupa por ventana temporal (encadenamiento de vecino más cercano, ≤20 días) y conectividad de grafo (union-find sobre pares de cuerpos, ≥3 cuerpos conectados); para cada grupo escanea diariamente ±5 días alrededor de la ventana de sus componentes buscando la fecha de mínima suma de orbes (máxima compacidad), con salvaguarda para que quede dentro de `window_start..window_end`; calcula `alignment_degree` (promedio del grado-en-signo si todos los cuerpos coinciden ±2.5°) y emite una config sintética `kind: "alignment"` con `components: [{bodies, aspect, exact_date, orb}]` (las configs de par originales se conservan intactas). Integrada en `build_mundane_forecast` (ordenada por fecha junto al resto; participa en `find_natal_impacts` solo vía aspectos duros ☌☍□ orbe ≤3° — nota: puede duplicar un impacto ya reportado por su config componente, no se dedupliica); NO participa en `probable_themes` ni `compute_cyclic_index`. Nuevo modelo `AlignmentComponent` + campos `components`/`alignment_degree` en `MundaneConfiguration` (`astro/models.py`). Verificado en 2026: alineamiento Júpiter-Urano-Neptuno-Plutón detectado el 20-jul (ventana 15→25-jul, `alignment_degree` ~4.46°), con los 6 pares componentes recomputados de forma independiente en orbe ≤3.5°. Tests nuevos: `backend/tests/test_alignments.py` (6 tests: firma de 4 cuerpos con orbes recomputados, conectividad del grafo, tolerancia del grado sensible, integración ordenada en `build_mundane_forecast`, endpoint `POST /api/mundane` + modo país). **Bloque B — frontend**: tipos (`AlignmentComponent`, `kind: "alignment"`), caché `astro_mundane_v5:` → `astro_mundane_v6:`; `MundaneTimelineChart` dibuja el alineamiento como banda violeta (`#7C3AED`, carril superior propio) de `window_start` a `window_end` con marcador ✧ en la fecha de compacidad + entrada de leyenda; tarjeta destacada (borde violeta, glifos de los N cuerpos, badge) en la lista de `/geopolitica`, visible en filtros "Mayores"/"Todos"; `MundaneWheel` con nueva prop `highlightPairs` que dibuja TODAS las líneas/halos de los pares componentes a la vez (reusa el render existente); `lib/mundane-corpus.ts` con `ALIGNMENT_NARRATIVES` curada para la firma de julio 2026 (lectura por elementos — aire: Urano en Géminis/Plutón en Acuario, ideas y vínculos colectivos; fuego: Júpiter en Leo/Neptuno en Aries, iniciativa y expansión — doctrina de concentración planetaria de Barbault) + generador de respaldo por elemento dominante para cualquier otro alineamiento; `lib/mundane-interpretation.ts` con rama propia (qué/cuándo/ventana, aspectos componentes con sus fechas, nota de grado sensible si `alignment_degree` existe). i18n `geo.alignment.*`, `geo.timeline.legend.alignment` ES/EN en paridad. **Bloque C — Tier 1 de UX (NN/g + Shneiderman) solo en `/geopolitica`**: franja "El año de un vistazo" (nº configuraciones mayores, próximo evento, alineamiento del año, nº eclipses — clic navega/selecciona); mini-nav sticky de anclas bajo los tabs de año (Cronología · Configuraciones · Temas · Índice · Bibliografía) con scroll suave (respeta `prefers-reduced-motion`) y `aria-current` vía `IntersectionObserver`; vistas enlazadas — seleccionar desde el timeline o el índice cíclico hace `scrollIntoView({block:"nearest"})` de la tarjeta y del panel de detalle si quedan fuera de viewport, pero NO en la selección automática de carga de página (bug detectado y corregido en Playwright: la selección por defecto al cargar disparaba un auto-scroll que tapaba el "vistazo"; ahora un ref `autoSelectRef` distingue selección automática de interactiva); segmented controls consistentes para modo/año/filtros (mismo radio y altura, `aria-pressed`, `focus-visible:ring-2`, `min-h-[44px]` en móvil); marcadores SVG de `MundaneTimelineChart`/`CyclicIndexChart` focusables (`tabIndex`, `role="button"`, `aria-label`, Enter/Espacio); halo de conjunción de `MundaneWheel` con `motion-safe:animate-pulse`. i18n `geo.nav.*`, `geo.overview.*` ES/EN en paridad (254 claves). Verificado: pytest 69/69 verde (63 previos + 6 nuevos), verify_corpus 54/54 PASS, check:i18n verde, `npm run build` pasa, Playwright confirma en desktop (1440×900) y móvil (390×844), ES/EN: el alineamiento aparece como banda + tarjeta destacada, la rueda dibuja las 6 líneas de sus componentes al seleccionarlo, las anclas y el scroll enlazado funcionan, el modo país (Chile) sigue operativo, y CERO errores de consola propios de la app (solo ruido de sandbox: fuentes de Google bloqueadas). Above-the-fold en 1440×900 queda en ~7 bloques (título, disclaimer, modo, año, mini-nav, vistazo, inicio de cronología).

> 2026-07-06 — Tier 1 de coherencia UX transversal (auditoría visual real: sistema de botones, navegación, truncados y móvil). Sin cambios de backend. **Bloque A — botones y navegación**: nuevo `components/ActionButton.tsx` (variantes `primary`/`secondary` × acento de módulo `blue`/`indigo`/`amber`, con `focus-visible:ring-2` incorporado) reemplaza los botones ad-hoc de `/carta`, `/transitos` y `/retorno`; se eliminan los botones "Inicio"/"Nueva carta" del cuerpo de esas páginas y de `/geopolitica` (el `NavHeader` global ya los tiene), dejando solo acciones contextuales ("← Carta natal" en transitos/retorno). Corregido el chip negro "Todos" y el toggle de vista indigo de `/transitos` (pasan a azul, el acento del módulo) y el espaciado "☉ Retorno Solar" (antes pegado sin espacio). `NavHeader` marca la sección activa vía `usePathname` (`text-blue-600 font-medium` + `aria-current="page"`). **Bloque B — truncados con affordance + móvil**: `AspectTable.tsx` muestra los primeros 8 aspectos + botón "Ver todos los aspectos (N)"/"Ver menos" (antes se cortaba a mitad de fila con scroll interno invisible); la lista de configuraciones de `/geopolitica` agrega fade inferior + scrollbar fina (`.geo-config-scroll` en `globals.css`); el selector de país en `<sm` pasa de 16 chips a un `<select>` nativo (chips se mantienen en `sm+`); los 3 modos de Geopolítica se colapsan en móvil a un segmented control de una fila (iconos + etiquetas cortas `geo.mode.*_short`); `PlanetPositions.tsx` conserva ℞ y el símbolo de dignidad como iconos junto al nombre del planeta en móvil (columnas Casa/D/R ocultas bajo `sm:table-cell`) y la casa como sufijo "· C{n}" en la columna de posición. **Bloque C — descubribilidad entre módulos**: botón "🌍 Ciclos mundiales sobre tu carta" en `/carta/[id]` → `/geopolitica?mode=natal&chart={id}`; 4ª tarjeta "Análisis Geopolítico" en la grilla de features de la portada (se elimina el banner indigo redundante del fondo de página); descripción de "Tránsitos año a año" actualizada para mencionar la cronología con días de influencia; cartas guardadas en `/nueva` con atajo "🌍 Geo" además de "✦ Tránsitos"/"Ver carta"; subtítulo de orientación bajo el título de `/transitos` (`transits.orientation`). i18n nuevas: `chart.aspects.show_all/show_less`, `chart.nav.geo`, `geo.mode.world_short/natal_short/country_short`, `transits.orientation`, `nueva.saved.geo`, `landing.features.geo.title/desc` (ES/EN en paridad exacta, 241 claves). Verificado: pytest 63/63 verde (backend sin tocar), check:i18n verde, `npm run build` pasa, Playwright confirma desktop+móvil en `/`, `/nueva`, `/carta/[id]`, `/transitos/[id]`, `/geopolitica` (mundial y país) sin errores de consola ni de hidratación propios de la app (solo ruido de sandbox: fuentes de Google bloqueadas).

> 2026-07-04 (b) — Modo "Impacto por país" en Geopolítica: cartas nacionales (tradición de Nicholas Campion, *The Book of World Horoscopes*, ya citada en `BIBLIOGRAPHY`). Es el nivel intermedio entre el análisis mundial puro y el impacto en la carta natal personal: reutiliza toda la maquinaria de `find_natal_impacts` con la carta de un país en vez de la de una persona. **Backend**: nuevo `astro/national.py` con `NATIONAL_CHARTS` (16 países/entidades: Chile, Argentina, México, EE.UU., España, Francia, Reino Unido, Alemania, Italia, Rusia, China, Japón, India, Brasil, Israel, Ucrania — fechas y horas documentadas, con nota bilingüe por país) y `compute_national_planets(country_id)` (cacheado en memoria). **Insensibilidad horaria por diseño**: solo Sol→Plutón, SIN Luna (la más sensible al error horario, ~13°/día) y SIN casas ni ángulos (dependen enteramente de la hora exacta); el error horario razonable queda muy por debajo de los orbes del módulo (2-3°). `MundaneRequest` admite `country` (mutuamente excluyente con `natal_planets`, 422 si llegan ambos o si el país es desconocido); `build_mundane_forecast` acepta `national_planets` y devuelve `national_impacts` reusando `find_natal_impacts` sin cambios. Nuevo `GET /api/mundane/countries` (10/min) como fuente única de verdad para el frontend. Tests: 14 nuevos (`test_national.py`: 9 cuerpos sin `None` en las 16 cartas, longitudes en rango, India con Sol en Leo y Chile con Sol en Virgo —aritmética de calendario, no dato de memoria—, país inválido lanza error; `test_api.py`: endpoint de países, modo país 200 OK, país inválido 422, país+natal_planets 422). **Frontend**: tercer botón de modo `🏳️ Impacto por país` en `app/geopolitica/page.tsx`, con chips de país (vía `/api/mundane/countries`, proxy nuevo `app/api/mundane/countries/route.ts`), deep-link `?mode=country&country=chile`, caché `astro_mundane_v4:` → `astro_mundane_v5:` (`lib/storage.ts` generaliza `chartId` a un `id` que sirve para carta natal o país). `MundaneWheel` reutiliza su prop `natalPlanets` para el anillo de la carta nacional (mismo shape). Nuevo `NATIONAL_PLANET_MEANINGS` + `getNationalImpactReading` en `lib/mundane-corpus.ts` (lectura mundialista compositiva de 2 frases por impacto — NO reutiliza las ~270 interpretaciones psicológico-personales de `interpretation-engine.ts`); `lib/mundane-interpretation.ts` con rama `countryMode` propia (lista los impactos con vocabulario nacional + nota de la carta usada + disclaimer). Puente hacia la cronología personal oculto en modo país (gated en `mode === "natal"`, sin cambios). i18n `geo.mode.country`, `geo.country.*` ES/EN en paridad exacta, incluida la nota de método ("cartas nacionales según la tradición de Campion; solo posiciones planetarias, sin Luna ni casas"). Verificado: pytest 63/63 verde (9 tests nuevos de `national.py` + 4 de API), verify_corpus 54/54 PASS, check:i18n verde (231 claves), `npm run build` pasa, Playwright confirma modo país con Chile seleccionado (rueda con anillo nacional, impactos, sin errores de consola propios de la app — solo ruido de sandbox: fuentes de Google bloqueadas y rate-limit por las pruebas repetidas).

> 2026-07-04 — Eclipses en Geopolítica (el disparador mundano clásico) + A-5 resuelto + keepalive anti cold-start. **Backend** (`astro/mundane.py`): nueva `find_eclipses(start, end)` usa `swe.sol_eclipse_when_glob`/`swe.lun_eclipse_when` (con fallback Moshier) avanzando eclipse a eclipse; cada uno es una configuración `kind: "eclipse"` con `eclipse_type` (`"solar"|"lunar"`), `eclipse_subtype` (`"total"|"anular"|"parcial"|"penumbral"`, decodificado de los bits de `retflag`), `bodies: ["Sol","Luna"]`, `sign` = signo del grado sensible (Sol en solares, Luna en lunares, calculados en el instante exacto del eclipse — no al mediodía, para no perder precisión frente al movimiento de la Luna), `sky` con la Luna inyectada en su posición exacta. Integrados en `build_mundane_forecast` ordenados por fecha junto al resto; participan en `find_natal_impacts` solo vía aspectos duros (☌ ☍ □, orbe ≤ 3°) sobre el grado del eclipse; NO participan en `probable_themes` ni en `compute_cyclic_index`. Nuevos campos `eclipse_type`/`eclipse_subtype` en `MundaneConfiguration` (`astro/models.py`). Prueba astronómica interna (sin fechas de memoria): para cada eclipse detectado en 2026-2027, separación Sol-Luna < 2° (solares) o > 178° (lunares) — 9 eclipses verificados (4 solares: anular 2026-02-17, total 2026-08-12, anular 2027-02-06, total 2027-08-02; 5 lunares: total 2026-03-03, parcial 2026-08-28, penumbral 2027-02-20/07-18/08-17), todos coincidiendo con eclipses reales conocidos. **A-5 resuelto**: nuevo `NatalPlanetIn` (`name` no vacío, `longitude` en `[0,360)`) valida `TransitRequest.natal_planets` y `MundaneRequest.natal_planets`; pydantic v2 ignora campos extra por defecto, así que los objetos `PlanetPosition` completos del frontend siguen pasando. **Frontend**: `lib/types.ts` (`kind` admite `"eclipse"`, `eclipse_type?`/`eclipse_subtype?`); `lib/mundane-corpus.ts` con `ECLIPSE_NARRATIVES` bilingües (solar = semilla/reinicio de ciclo, lunar = culminación/liberación colectiva) y `getEclipseNarrative` (orden gramatical distinto por idioma: ES pospone el subtipo, EN lo antepone); `lib/mundane-interpretation.ts` con párrafos propios (qué/cuándo/dónde, síntesis + nota de grado "sensibilizado", nota natal de "año marcado" cuando el eclipse toca un planeta natal); `MundaneTimelineChart.tsx` con marcador propio (◐, negro con anillo dorado `#F59E0B`, más grande que un marcador mayor) en el carril de los mayores + entrada de leyenda; tarjetas con glifo ◐ + subtipo; rueda de detalle resalta Sol–Luna (halo para solares vía `highlightAspect: "Conjunción"`, línea para lunares vía `"Oposición"`) y muestra `eclipse_subtype` como chip. i18n `geo.eclipse.subtype.*` y `geo.timeline.legend.eclipse` ES/EN en paridad exacta. `lib/storage.ts`: caché `astro_mundane_v3:` → `astro_mundane_v4:`. **Keepalive**: `.github/workflows/keepalive.yml` hace ping a `/health` cada 10 min (`cron "*/10 * * * *"` + `workflow_dispatch`) para mitigar el cold start del free tier de Render (A-4). Verificado: pytest 54/54 verde (9 tests nuevos de eclipses + 5 de A-5), verify_corpus 54/54 PASS, check:i18n verde (223 claves), `npm run build` pasa, Playwright confirma cero errores de consola en `/geopolitica` (ES/EN, filtros Mayores/Todos, detalle de eclipse).

> 2026-07-03 (c) — Pulido de UX/UI de Geopolítica y de la cronología de tránsitos, a partir de una auditoría visual real. **Bugs**: `app/geopolitica/page.tsx` ya no lee `useSearchParams()` en los inicializadores de `useState` (causaba "Hydration failed" al abrir un deep-link `?year=&mode=&chart=`); ahora `mode`/`year`/`selectedChartId` arrancan en sus valores neutros y los params entrantes se aplican una sola vez en un `useEffect` de montaje, con un flag `paramsApplied` que además evita que el efecto de sincronización de URL dispare antes de aplicarlos. Eliminado el título "Configuraciones del año" duplicado (queda solo el de los chips de filtro). Copy de disparadores de Marte aclarado en `lib/mundane-interpretation.ts`. **Jerarquía visual**: los disparadores de Marte ya no ahogan los ciclos mayores — con el filtro "Mayores" (default) desaparecen de la lista de tarjetas (siguen en el timeline, en un carril propio pegado al eje, marcador ~60% más chico y rojo apagado `#F87171`); en "Todos"/"Disparadores" se muestran como tarjetas compactas de una sola línea. Lista de configuraciones contenida (`max-h` + scroll + sticky en xl; en móvil, 5 tarjetas + "Ver todas (N)"). Leyenda añadida bajo `MundaneTimelineChart`. `CyclicIndexChart`: los marcadores de mes con configuración mayor pasan de círculos huecos sobre la línea a diamantes indigo en una franja fija (ya no se leen como una segunda serie); sección colapsable (cerrada por defecto). Orden de página reordenado: cronología del año visible en la primera pantalla (justo tras los tabs de año), luego chips de filtro y el grid lista/detalle; temas probables e índice cíclico bajan al final, antes de la bibliografía. Disclaimer comprimido a una línea con expandir/colapsar. `MundaneWheel`: las conjunciones (línea de ~0px entre los dos cuerpos) ahora muestran un halo doble en el punto medio del par en vez de una línea invisible. Ambos gráficos SVG de Geopolítica scrollean horizontalmente en pantallas angostas en vez de comprimirse. **Tránsitos**: `components/TransitYearTimeline.tsx` pondera las barras del modo "Todos" por `importance` (crítica/alta = opacidad plena, media = 0.75, baja = 0.5) y las de Marte se dibujan más finas (~70% del alto), para que su fila de muchas pasadas menores no compita visualmente con el resto. i18n: nuevas claves ES/EN en paridad exacta (disclaimer corto, leyenda del timeline, "ver todas", leyenda del índice cíclico). Verificado: pytest 45/45 verde, check:i18n verde (218 claves), `npm run build` pasa, Playwright confirma cero errores de hidratación/consola en `/geopolitica` (ambos modos, desktop y móvil) y en `/transitos/[id]`.

> 2026-07-03 (b) — "Disparadores rápidos" de Marte en Geopolítica (doctrina del déclencheur, Barbault/Ebertin). **Backend** (`astro/mundane.py`): nueva `find_mars_triggers(start, end)` escanea Marte contra los 5 lentos buscando SOLO aspectos duros (Conjunción/Oposición/Cuadratura, orbe de detección 2.0°, paso diario); refina con `_find_exact_mundane_date` y calcula la ventana del disparador (`window_start`/`window_end`: tramo contiguo con orbe ≤ 2°). `compute_mundane_sky` admite `include_mars` opcional. Cada disparador es una configuración `kind: "trigger"` (`bodies: ["Marte", <lento>]`, `analogs: []`, `themes: []`) integrada en `build_mundane_forecast().configurations` (ordenada por fecha junto al resto); participa en `find_natal_impacts` pero NO en `probable_themes` ni en `compute_cyclic_index`. Nuevos campos `window_start`/`window_end` en `MundaneConfiguration` (`astro/models.py`). Caso verificado: conjunción Marte–Urano exacta el 2026-07-04 (orbe 0.16°, ventana 2026-07-01→2026-07-06). Tests nuevos en `backend/tests/test_mundane.py` (4 tests: fecha exacta Marte–Urano, solo aspectos duros con ventanas 2-30 días, integración ordenada en `build_mundane_forecast`, impactos natales de disparadores). **Frontend**: `lib/types.ts` (`kind` admite `"trigger"`, `window_start?`/`window_end?`); `lib/mundane-corpus.ts` con `TRIGGER_NARRATIVES` (5 parejas Marte–lento, síntesis arquetípica de 2-3 frases cada una, fuente Ebertin *The Combination of Stellar Influences* añadida a `BIBLIOGRAPHY`) y `getConfigNarrative` con rama `kind==="trigger"`; `lib/mundane-interpretation.ts` con párrafos propios para disparadores (evento + ventana, síntesis + doctrina del déclencheur + mención genérica de la configuración lenta más cercana en el tiempo vía `nearbySlowConfig`, disclaimer analógico). `app/geopolitica/page.tsx` + `components/MundaneTimelineChart.tsx`: marcadores menores rojos (`#EF4444`, símbolo ♂+aspecto) para disparadores en filtros "Mayores"/"Todos"; nuevo chip "Disparadores"; badge "disparador" en tarjetas; rueda resalta la línea Marte–lento; panel de detalle muestra la ventana del disparador y nota de recurrencia (~2 años, lectura por arquetipo) en vez de eco histórico/análogos. `lib/storage.ts`: caché mundana `astro_mundane_v2:` → `astro_mundane_v3:` (forma de respuesta cambiada). i18n `geo.filter.triggers`, `geo.trigger.*` ES/EN con paridad exacta. Verificado: pytest 45/45 verde, verify_corpus 54/54 PASS, check:i18n verde (209 claves), `npm run build` pasa, TestClient confirma `marte_urano_conjuncion_20260704` con `kind`/`window`/Marte en `sky`.

> 2026-07-03 — Cronología anual interactiva de tránsitos personales ("Tu año") + retrogradaciones de planetas rápidos + puente desde Geopolítica. **Backend** (`astro/transits.py`): nueva `compute_retrograde_periods(year)` detecta los períodos retrógrados de Mercurio/Venus/Marte que intersectan el año (escaneo diario de cambios de signo de velocidad + refinamiento binario ±0.5 día; no recorta fechas de estación aunque caigan en el año vecino); expuesto como `retro_periods` en `POST /api/transits` (nuevo modelo `RetroPeriod` en `astro/models.py`). Tests en `backend/tests/test_retro.py` (Mercurio 3-4 períodos/año de 15-35 días, Venus/Marte 0-1 de 35-50/55-85 días, más verificación vía TestClient). **Frontend**: `components/TransitYearTimeline.tsx` (nuevo, SVG puro, estilo Gantt) — modo "Todos" con una fila por planeta transitante (Plutón→Marte) y barras `enters_orb`→`leaves_orb` con ♦ en `exact_date`, más fila final "℞ rápidos"; modo zoom por astro (`planetFilter`) con una fila por evento y fechas completas; clic selecciona/deselecciona (misma key `"{transitante}_{aspecto}_{natal}"` usada en `interpretation-engine.ts`); tooltip nativo; línea "hoy" si el año es el actual. `app/transitos/[id]/page.tsx`: toggle de vista `[📅 Cronología | 🎡 Por mes]` (default Cronología; "Por mes" preserva intacta la vista anterior de chips/rueda y análisis anual) + chips de zoom (Todos/planetas presentes/℞) + panel de detalle (días de influencia, fecha exacta, interpretación reutilizada de `interpretation-engine.ts` con expandir/contraer, o mini-interpretación de retro). `lib/retro-meanings.ts` (nuevo): mini-corpus bilingüe de significados de retrogradación (Mercurio/Venus/Marte). `lib/date-utils.ts` (nuevo): `parseLocalDate` centralizado (antes duplicado en `geopolitica/page.tsx` y `MundaneTimelineChart.tsx`). **Puente Geopolítica → cronología personal**: en modo natal, bajo el panel "Impacto en tu carta", tarjeta CTA indigo (`geo.personal_cta.*`) hacia `/transitos/{chartId}`. i18n `transits.timeline.*`, `transits.view.*` y `geo.personal_cta.*` ES/EN completos. Verificado: pytest 41/41 verde, verify_corpus 54/54 PASS, check:i18n verde (205 claves), `npm run build` pasa.

> 2026-07-02 (b) — Tier 1 global: tests + CI, i18n natal completo, geopolítica enriquecida, robustez. **Tests/CI**: suite pytest en `backend/tests/` (36 tests auto-verificables: equinoccios, retorno solar consistente, consolidación de retrógrados, matching mundano, endpoints vía TestClient), `frontend/scripts/check-i18n.mjs` (paridad exacta de claves ES/EN, script npm `check:i18n`) y workflow `.github/workflows/ci.yml` (pytest + verify_corpus + check:i18n + build en cada PR/push a main). **i18n**: `natal-interpretations.ts` bilingüe completo (getters con `lang`; conectado a `InterpretationModal` y `app/carta/[id]`) — el pendiente de i18n natal queda cerrado. **Geopolítica**: los impactos natales reusan las ~270 interpretaciones de `interpretation-engine.ts` (clave `{cuerpo}_{aspecto}_{natal}`, summary + expandir a detailed/advice, degradación silenciosa); deep-links compartibles `?year=&mode=&chart=&config=` (Suspense + useSearchParams + router.replace, amplía el filtro si la config enlazada estaba oculta); `CyclicIndexChart` con marcadores clicables en los meses con configuraciones mayores (tooltip nativo). **Robustez/seguridad**: `lib/api-fetch.ts` (`postWithWakingRetry`) + proxies `chart`/`transits`/`solar-return` endurecidos con el patrón de mundane (parseo defensivo, 503 `backend_waking`) y consumidores (`nueva`, `carta`, `transitos`) con aviso de cold start y auto-reintento; headers de seguridad HTTP en `next.config.mjs` (GAP A-6 resuelto; A-2 resuelto); metadata SEO por segmento (`geopolitica/`, `glosario/`, `nueva/` layouts); clave i18n `common.error.waking`. Verificado: pytest verde, verify_corpus 54/54 PASS, check:i18n verde, `npm run build` pasa.

> 2026-07-02 — Geopolítica Tier 1: matching por ciclo, corpus verificado y ampliado, timeline visual, índice cíclico. **Backend** (`astro/mundane.py`): `match_historical_analogs` ahora matchea por **ciclo** (mismo par ordenado de cuerpos) en vez de exigir aspecto exacto — `match_type: "exact"` (mismo aspecto) o `"phase"` (otra fase del mismo ciclo, doctrina de Barbault); cada análogo incluye `event_aspect`. Eventos con **firmas múltiples** (`signatures`, lista) para momentos que coinciden con más de una configuración lenta (Fort Sumter 1861, batalla de Midway 1942). Corpus histórico ampliado de 16 a **52 eventos**, todos verificados contra el cielo real con el nuevo `backend/scripts/verify_corpus.py` (orbe ≤ 8° para aspectos, coincidencia exacta de signo para ingresos; exit code ≠ 0 si hay FAIL). Corregidos los casos que fallaban la verificación (Constantinopla 1453 es Cuadratura Saturno–Urano, no Conjunción; sustituida la independencia de EE.UU. 1776 por la Constitución de 1787 — Plutón no estaba en Acuario en 1776; el ingreso de Urano en Géminis de 1942 se ajustó a la fecha de Midway). Cada configuración agrega su propio campo `themes` (temas de sus análogos); se descartan configuraciones cuya fecha exacta cae fuera del rango solicitado; nuevo `compute_cyclic_index()` (índice cíclico de Barbault: suma de separaciones angulares de los 10 pares lentos, un punto por mes) expuesto como `cyclic_index` en `POST /api/mundane`. **Frontend**: `components/MundaneTimelineChart.tsx` (cronología SVG ene→dic con marcadores por configuración, anti-solape por carriles) y `components/CyclicIndexChart.tsx` (línea SVG del índice cíclico con mínimo del año resaltado) — ambos nuevos, SVG puro. `MundaneWheel.tsx` con prop `overlaySky` (anillo interior gris para comparar el cielo de un análogo histórico contra el cielo actual a color). Página `/geopolitica`: toggle de época de 3 estados (`[año] [Superponer] [Solo época]`) con caption de orbe por época; mini-strip "eco histórico" (1400–2030, click para comparar); chips de filtro (Mayores/Todos/Con precedentes); tarjetas con glifos de cuerpo + símbolo de aspecto; chip de fuente bibliográfica. `lib/mundane-corpus.ts`: narrativa curada para los eventos nuevos y para las 16 firmas únicas de configuración de 2026-2027; bibliografía ampliada con Baigent/Campion/Harvey y Nicholas Campion. `lib/storage.ts`: caché persistente `saveMundane`/`loadMundane` (clave `astro_mundane_v2:{year}_{mode}_{chartId|world}`, invalida el corpus viejo); el botón "Reintentar" siempre salta la caché. Verificado con TestClient (2026/2027, con y sin `natal_planets`, 200 OK; Constantinopla aparece como análogo `phase`) y en la app real (Playwright: cambio de año/filtros/configuración, overlay/solo-época, recarga de página sirviendo desde caché sin nueva petición al backend) sin errores de consola ni excepciones. `npm run build` pasa.

> 2026-07-01 (b) — Panel de lectura narrativa en Geopolítica. Nuevo `lib/mundane-interpretation.ts` (`generateMundaneReading`) genera una interpretación fluida bilingüe (varios párrafos) al estilo de una lectura mundialista: nombra planetas, grados, signo y fecha, el eco histórico (análogos + Cassanya/Barbault/Tarnas) y un hook de placements — en modo natal lista los planetas natales tocados; en modo mundial sugiere grados/signos de la misma cruz de modalidad. Se muestra **a la derecha de la rueda** (`app/geopolitica/page.tsx`, grid wheel+lectura, sticky). Framing analógico con recordatorio de disclaimer (sin afirmar hechos concretos). i18n `geo.reading.title`. `npm run build` pasa.

> 2026-07-01 — Módulo de Análisis Geopolítico (astrología mundial). Nueva ruta standalone `app/geopolitica/page.tsx` con **dos modos** (botones): **Análisis mundial** (independiente) e **Impacto en mi carta natal** (elige carta guardada). Backend: `astro/mundane.py` computa configuraciones reales de planetas lentos 2026-2027 (aspectos + ingresos de signo, con refinamiento binario), un corpus curado de ~16 eventos históricos (Constantinopla 1453, revoluciones, guerras, etc.) cuyo **cielo se computa en vivo** vía Swiss Ephemeris/Moshier, matching analógico por firma, síntesis temática e impactos natales. Endpoint `POST /api/mundane`. Frontend: `components/MundaneWheel.tsx` (rueda SVG de cielo con aspecto definitorio resaltado + anillo natal opcional), `lib/mundane-corpus.ts` (narrativa + bibliografía bilingüe con generador de respaldo). Framing **analógico con disclaimer** — interpretación, no predicción factual. Bibliografía: Cassanya (Crónica Astrológica del Siglo XX), Barbault (índice cíclico), Tarnas (Cosmos and Psyche). Verificado: conjunción Saturno–Neptuno detectada el 2026-02-20; ambos modos del endpoint 200 OK; `npm run build` pasa. i18n ES/EN completo (`geo.*`). NOTA: reintroduce astrología "mundial" (eliminada el 2026-06-17) pero con enfoque histórico-analógico distinto y ruta propia `/geopolitica`.

> 2026-06-23 — Portada + nuevas rutas + glosario. `app/page.tsx` es ahora una portada de bienvenida (intro "¿qué es una carta natal?", tarjetas de planetas, botones "Realizar carta natal" → `/nueva` y "Aprende los significados" → `/glosario`). El formulario BirthDataForm y el panel "Cartas guardadas" se movieron a `app/nueva/page.tsx`. Se añadió `app/glosario/page.tsx` con glosario completo (aspectos, retrogradación, dignidades, planetas, ángulos, orbes). Navegación global con botones "Inicio / Nueva carta" (componentes `PageNav`, `NavHeader`). `storage.ts` usa caché v2 por año. Interpretaciones mensuales enriquecidas. i18n ES/EN completo para interfaz + corpus de tránsitos/retorno solar; interpretaciones natales (click en rueda) pendientes. Ver `GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` para seguridad.

> 2026-06-21 — i18n bilingual completado (ES/EN). Corpus de tránsitos/retorno solar 100% bilingüe. `generateMonthBrief` y `generateYearBrief` reciben `lang`. Rueda mes/año chips y fechas clave usan locale dinámico. Mensajes de error usan `t()`. InterpretationModal: UI chrome 100% bilingüe. `transits.corpus_note` vaciado en EN.

> 2026-06-17 — Rediseño de tránsitos + eliminación de astrología mundial. Vista de tránsitos reemplazada por: selector de año (actual + 4), filtro por mes en el año actual con rueda interactiva (planetas como esferas 3D; retrógrados con anillo rojo + ℞ + ↺) y resumen breve; años futuros con análisis anual. Backend: `sky` por mes + `transit_retrograde`. Eliminada toda la feature mundial.

### Core
- [x] CLAUDE.md creado y actualizado
- [x] Estructura de directorios creada
- [x] `docker-compose.yml`
- [x] `render.yaml` (raíz del repo) — configuración Render para deploy del backend

### Backend
- [x] `main.py` — FastAPI app, CORS, routes, rate limiting, logging
- [x] `requirements.txt` — incluye slowapi 0.1.9
- [x] `Dockerfile` — non-root user (uid=1000), curl para healthcheck
- [x] `astro/models.py` — Pydantic v2 models con validación semántica + `SkyPlanet` + `transit_retrograde`
- [x] `astro/chart.py` — carta natal + `calculate_solar_return()` (binary search)
- [x] `astro/aspects.py` — detección y scoring de aspectos
- [x] `astro/houses.py` — casas Placidus (fallback: Whole Sign)
- [x] `astro/transits.py` — escaneo diario + refinamiento binario + `transit_retrograde` + snapshot `sky` por mes (10 planetas al día 15)

### Endpoints del backend
| Endpoint | Rate limit | Descripción |
|----------|-----------|-------------|
| `GET /health` | 10/min | Health check |
| `POST /api/chart` | 20/min | Carta natal |
| `POST /api/transits` | 5/min | Tránsitos (año actual por mes + 4 años futuros) |
| `POST /api/solar-return` | 10/min | Retorno solar |
| `POST /api/mundane` | 5/min | Análisis geopolítico (configuraciones mundiales + análogos históricos + impacto natal opcional) |
| `GET /api/calendar` | 10/min | Calendario astrológico diario (mes solicitado + 2 siguientes: Luna/Sol y eventos por día) |

### Frontend — Páginas
- [x] `app/layout.tsx` — layout principal
- [x] `app/page.tsx` — **portada**: intro, tarjetas de planetas, botones "Realizar carta natal" → `/nueva` y "Aprende los significados" → `/glosario`
- [x] `app/nueva/page.tsx` — formulario BirthDataForm + **panel de cartas guardadas**
- [x] `app/glosario/page.tsx` — glosario (aspectos, retrogradación, dignidades, planetas, ángulos, orbes)
- [x] `app/carta/[id]/page.tsx` — carta natal + botón "☉ Retorno Solar"
- [x] `app/transitos/[id]/page.tsx` — tránsitos: selector de año (actual + 4), filtro por mes con rueda interactiva y resumen breve; años futuros con análisis anual
- [x] `app/retorno/[id]/page.tsx` — **retorno solar** (tema ámbar) + **panel ejecutivo lateral**
- [x] `app/not-found.tsx`, `app/error.tsx`

### Frontend — API proxies
- [x] `app/api/chart/route.ts`
- [x] `app/api/transits/route.ts`
- [x] `app/api/solar-return/route.ts` — timeout 60s

### Frontend — Componentes
- [x] `components/BirthDataForm.tsx` — con geocoding Nominatim + DST
- [x] `components/ChartWheel.tsx` — **SVG puro** (sin D3), estilo astro.com
- [x] `components/AspectTable.tsx`
- [x] `components/PlanetPositions.tsx` — con **columna de dignidades** (⌂ ↑ ⊗ ↓)
- [x] `components/TransitZodiacWheel.tsx` — birueda zodiacal estilo astro.com; planetas como esferas 3D SVG; retrógrados con anillo rojo + ℞ + ↺; leyenda de movimiento
- [x] `components/SolarReturnSummaryPanel.tsx` — **panel ejecutivo retorno solar**
- [x] `components/InterpretationModal.tsx` — modal de interpretaciones natales (click en rueda)
- [x] `components/ChartSummary.tsx` — resumen compacto de carta natal
- [x] `components/PageNav.tsx` — navegación "Inicio / Nueva carta" en páginas de detalle
- [x] `components/NavHeader.tsx` — cabecera de navegación global
- [x] `components/Providers.tsx` — envuelve la app con `LanguageProvider`
- [x] `components/LangToggle.tsx` — selector ES/EN
- [x] `components/InterpretationCard.tsx` — (legacy, sin uso activo)
- [x] `components/TransitTimeline.tsx` — (legacy, sin uso activo)

### Frontend — Librerías
- [x] `lib/types.ts` — interfaces TypeScript (incluye `SolarReturnRequest`, `SkyPlanet`, `transit_retrograde` en `TransitEvent`)
- [x] `lib/storage.ts` — localStorage: `saveChart`, `loadChart`, `saveTransits`, `loadTransits`, `saveYearTransits`, `loadYearTransits`, `saveSolarReturn`, `loadSolarReturn`, `listCharts`, `deleteChart` (caché v2 por año)
- [x] `lib/zodiac-utils.ts` — helpers + **`getPlanetDignity()`** + `DIGNITY_SYMBOL/COLOR`
- [x] `lib/interpretation-engine.ts` — ~270 interpretaciones de tránsitos con claves en español (ej. `"júpiter_conjunción_sol"`); **bilingüe** (`lang` param → ES/EN)
- [x] `lib/brief-summary.ts` — `generateMonthBrief(month, exactCalendar, lang)` + `generateYearBrief(data, year, lang)` (resúmenes breves bilingüe)
- [x] `lib/solar-return-summary.ts` — **`generateSolarReturnSummary(srChart, lang)`** (Forrest/Tyl/Sasportas/Rodden) bilingüe
- [x] `lib/wheel-geometry.ts` — helpers SVG: `polarXY`, `describeSector`, `makeToAngle`
- [x] `lib/chart-summary.ts` — helpers para `ChartSummary`
- [x] `lib/natal-interpretations.ts` — corpus de interpretaciones natales (click en rueda; cuerpo en español, fuera de scope i18n)
- [x] `lib/i18n.tsx` — `LanguageProvider` + `useT()` → `{ lang, setLang, t }`
- [x] `lib/locales/es.ts` — diccionario español completo (incluyendo `modal.*` y `chart.loading_hint`)
- [x] `lib/locales/en.ts` — diccionario inglés completo (incluyendo `modal.*` y `chart.loading_hint`)

### Documentación
- [x] `GAP_ANALYSIS_DEPLOY.md` — análisis completo de seguridad para deploy a producción
- [x] `AUDIT_DEPLOY.md` — histórico de seguridad + nuevas features (2026-04-28)

---

## ARQUITECTURA

```
AstroEngineering/
├── CLAUDE.md                           ← Este archivo
├── README.md
├── GAP_ANALYSIS_DEPLOY.md              ← Seguridad + producción
├── AUDIT_DEPLOY.md                     ← Histórico seguridad (2026-04-28)
├── docker-compose.yml
├── render.yaml                         ← Configuración deploy backend en Render
├── backend/
│   ├── main.py                         ← FastAPI + CORS + rate limiting + logging
│   ├── requirements.txt                ← incluye slowapi
│   ├── Dockerfile                      ← non-root user astro (uid=1000)
│   └── astro/
│       ├── __init__.py
│       ├── models.py                   ← Pydantic v2 + validación semántica + SkyPlanet
│       ├── chart.py                    ← natal + solar return (binary search)
│       ├── aspects.py                  ← Detección y scoring de aspectos
│       ├── houses.py                   ← Casas Placidus (fallback: Whole Sign)
│       └── transits.py                 ← transit_retrograde + sky snapshot por mes
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                    ← Portada: intro, planetas, botones /nueva y /glosario
    │   ├── nueva/page.tsx              ← Formulario BirthDataForm + cartas guardadas
    │   ├── glosario/page.tsx           ← Glosario (aspectos, dignidades, planetas, etc.)
    │   ├── carta/[id]/page.tsx         ← Carta natal completa + botón SR
    │   ├── transitos/[id]/page.tsx     ← Selector año, chips mes, rueda interactiva, análisis anual
    │   ├── retorno/[id]/page.tsx       ← Retorno solar + panel ejecutivo
    │   ├── not-found.tsx
    │   ├── error.tsx
    │   └── api/
    │       ├── chart/route.ts          ← Proxy → backend /api/chart
    │       ├── transits/route.ts       ← Proxy → backend /api/transits
    │       └── solar-return/route.ts   ← Proxy → backend /api/solar-return
    ├── components/
    │   ├── AspectTable.tsx
    │   ├── BirthDataForm.tsx
    │   ├── ChartSummary.tsx
    │   ├── ChartWheel.tsx              ← SVG puro, estilo astro.com
    │   ├── InterpretationCard.tsx      ← (legacy, sin uso activo)
    │   ├── InterpretationModal.tsx     ← Modal interpretaciones natales (click en rueda)
    │   ├── LangToggle.tsx              ← Selector ES/EN
    │   ├── NavHeader.tsx               ← Cabecera global
    │   ├── PageNav.tsx                 ← Botones "Inicio / Nueva carta"
    │   ├── PlanetPositions.tsx         ← con columna de dignidades
    │   ├── Providers.tsx               ← Envuelve app con LanguageProvider
    │   ├── SolarReturnSummaryPanel.tsx
    │   ├── TransitTimeline.tsx         ← (legacy, sin uso activo)
    │   └── TransitZodiacWheel.tsx      ← esferas 3D, retrógrados con anillo rojo + ℞ + ↺
    └── lib/
        ├── brief-summary.ts            ← generateMonthBrief() + generateYearBrief()
        ├── chart-summary.ts
        ├── i18n.tsx                    ← LanguageProvider + useT()
        ├── interpretation-engine.ts    ← ~270 interpretaciones, claves en español
        ├── locales/
        │   ├── en.ts
        │   └── es.ts
        ├── natal-interpretations.ts
        ├── solar-return-summary.ts
        ├── storage.ts                  ← saveYearTransits/loadYearTransits (caché v2)
        ├── types.ts
        ├── wheel-geometry.ts
        └── zodiac-utils.ts             ← getPlanetDignity() + DIGNITY_SYMBOL/COLOR
```

---

## CÓMO CORRER LOCALMENTE

### Con Docker (recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up --build

# Backend disponible en: http://localhost:8000
# Frontend disponible en: http://localhost:3000
# Docs API (Swagger): http://localhost:8000/docs (solo en desarrollo)
```

### Sin Docker (desarrollo rápido)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### GitHub Codespace

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --host 0.0.0.0
# → Hacer el puerto 8000 PUBLIC en la pestaña PORTS

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → Hacer el puerto 3000 PUBLIC en la pestaña PORTS

# Terminal 3 — Configurar URL del backend
echo "NEXT_PUBLIC_API_URL=https://TU-CODESPACE-8000.app.github.dev" > frontend/.env.local
# Reiniciar Terminal 2 para cargar la variable
```

---

## VARIABLES DE ENTORNO

### Desarrollo (frontend/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Producción — Render (backend)
```bash
ENV=production
FRONTEND_URL=https://tu-app.vercel.app
EPHE_PATH=/usr/share/swisseph/ephe
```

### Producción — Vercel (frontend)
```bash
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```

---

## DEPLOYMENT (gratuito)

| Componente | Plataforma | Costo |
|-----------|-----------|-------|
| Frontend | **Vercel** | Gratis siempre |
| Backend | **Render** | Gratis (cold start ~30s tras inactividad) |

**Pasos:**
1. Render: New Web Service → repo → autoselecciona `render.yaml` en la raíz
2. Render: configurar manualmente env var `FRONTEND_URL=https://tu-app.vercel.app`
3. Vercel: New Project → repo → Root Dir: `frontend` → Next.js
4. Vercel: agregar env var `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com`

> Ver `GAP_ANALYSIS_DEPLOY.md` para lista completa de brechas de seguridad pendientes (Sprint 1 y 2).

---

## ENDPOINTS DEL BACKEND

### POST /api/chart — Carta natal
```json
// Request
{ "name": "Nicolás", "birth_date": "1990-05-15", "birth_time": "14:30",
  "latitude": -33.4489, "longitude": -70.6693, "timezone_offset": -4 }
// Response: planetas(12), casas(12), ascendente, MC, aspectos
```

### POST /api/transits — Tránsitos 12 meses
```json
// Request
{ "natal_planets": [...], "start_date": "2026-04-07", "end_date": "2027-04-07",
  "latitude": -33.4489, "longitude": -70.6693 }
// Límite: max 366 días entre start y end
// Response: current_transits, timeline mensual, exact_aspects_calendar
```

### POST /api/solar-return — Retorno solar
```json
// Request
{ "natal_sun_longitude": 54.62, "year": 2026,
  "latitude": -33.4489, "longitude": -70.6693, "timezone_offset": -4, "name": "Nicolás" }
// Response: ChartResponse + sr_year, sr_local_time, sr_ut_time
```

---

## NOTAS CRÍTICAS (NO OLVIDAR)

1. **Hora local → UT**: Siempre restar `timezone_offset` antes de `swe.julday()`.
2. **Efemérides**: Archivos `.se1` en `/usr/share/swisseph/ephe`. Sin ellos, usa Moshier (~0.1° de error, aceptable para MVP).
3. **Placidus en latitudes altas**: Falla para latitudes > 66°. Fallback a Whole Sign Houses en `houses.py`.
4. **Retrógrados en tránsitos**: Un planeta retrógrado puede formar el mismo aspecto 3 veces. `consolidate_transits()` en `transits.py` agrupa las pasadas.
5. **Orbes de tránsitos**: Más estrictos que natales. Ver `TRANSIT_ORBS` en `aspects.py`.
6. **ChartWheel sin D3**: SVG puro React. `makeToAngle(ascLon)` rotaciona la rueda con el ASC a la izquierda (9 o'clock).
7. **swe.jdut1_to_utc**: Devuelve 6 valores `(year, month, day, hour, minute, second)`, NO 4. Ya corregido en `chart.py`.
8. **Rate limiting**: `slowapi` con límites por IP. En desarrollo local no aplica (localhost).
9. **CORS en producción**: Requiere `FRONTEND_URL` como variable de entorno en Render. Sin ella, solo acepta localhost.
10. **Swagger docs**: Deshabilitados cuando `ENV=production`. En desarrollo siguen en `/docs`.

---

## VALIDACIÓN DE PRECISIÓN

Comparar contra [astro.com](https://astro.com) (tolerancia: ±0.05°):

| Test | Fecha | Hora | Lugar | UTC |
|------|-------|------|-------|-----|
| 1 | 15 May 1990 | 14:30 | Santiago, Chile (-33.45,-70.67) | UTC-4 |
| 2 | 01 Ene 2000 | 00:00 | Londres (51.51, -0.13) | UTC+0 |
| 3 | 21 Jun 1985 | 08:15 | Ciudad de México (19.43,-99.13) | UTC-6 |

---

## DISEÑO / UI

- **Paleta principal:** blanca/slate — fondo blanco, bordes `#E2E8F0`
- **Tipografía datos:** JetBrains Mono
- **Acento tránsitos:** azul (`#2563EB`)
- **Acento retorno solar:** ámbar (`#D97706`)
- **Elementos:** fuego `#DC2626` | tierra `#16A34A` | aire `#D97706` | agua `#2563EB`
- **Aspectos:** conjunción=slate | oposición=rojo | cuadratura=naranja | trígono=azul | sextil=verde
- **Dignidades:** domicilio=esmeralda ⌂ | exaltación=azul ↑ | detrimento=naranja ⊗ | caída=rojo ↓

---

## ChartWheel — Geometría SVG

```
R_ZODIAC_OUT = 268   ← borde exterior anillo zodiacal
R_ZODIAC_IN  = 218   ← borde interior anillo zodiacal
R_PLANET_OUT = 218   ← borde exterior anillo de planetas
R_PLANET_IN  = 168   ← borde interior anillo de planetas (fill #F8FAFC)
R_DOT        = 216   ← punto exacto del planeta en el zodíaco
R_GLYPH      = 196   ← símbolo del planeta
R_DEG_LABEL  = 177   ← etiqueta de grado
R_HOUSE_NUM  = 120   ← números de casas
R_ASPECT     = 88    ← líneas de aspectos
R_CENTER     = 22    ← círculo central
```

Colisiones: `resolveCollisions()` asigna `rOffset ±12` cuando dos planetas están a < 7° entre sí.

---

## Retorno Solar — Algoritmo

```python
# 1. Escaneo de 5 días para encontrar la ventana de cruce
# 2. Búsqueda binaria de 60 iteraciones hasta |diff| < 1e-7
# 3. swe.jdut1_to_utc(sr_jd, 1) → (year, month, day, hour, minute, second)
# 4. calculate_natal_chart(birth_data) con timezone_offset=0 (ya en UT)
```

---

## Panel Ejecutivo — Estructura

### Resúmenes de tránsitos
Generados desde `lib/brief-summary.ts`:
- `generateMonthBrief(transits, month, lang)` — resumen breve para el mes seleccionado (vista de año actual filtrada por mes)
- `generateYearBrief(transits, year, lang)` — análisis anual breve para años futuros (sin detalle mensual)

### SolarReturnSummaryPanel (retorno solar)
Genera con `generateSolarReturnSummary(srChart, lang)` de `lib/solar-return-summary.ts`.
Secciones: year_theme · asc_interpretation · mc_interpretation · angular_planets · stelliums · key_aspects · element_distribution · opportunities · challenges · advice

---

## SCORING DE TRÁNSITOS

```
score = (peso_planeta_transitante + peso_planeta_natal) × peso_aspecto × factor_orbe / 10
factor_orbe = max(0, 1 - orb / 5)
Importancia: score >= 8 → "crítica" | >= 5 → "alta" | >= 3 → "media" | < 3 → "baja"
```

Pesos planetarios: Plutón=10, Neptuno=9, Urano=8, Saturno=7, Júpiter=6, Sol=5, Marte=4...
Pesos de aspectos: Conjunción=10, Oposición=9, Cuadratura=8, Trígono=7, Sextil=5...

---

## MOTOR DE INTERPRETACIONES

Ubicación: `frontend/lib/interpretation-engine.ts`

~270 combinaciones: 6 planetas transitantes × 9 planetas/puntos natales × 5 aspectos mayores.

Claves en español (ej. `"júpiter_conjunción_sol"`, `"saturno_conjunción_sol"`). Función `getInterpretation(key, lang)` retorna la interpretación en el idioma solicitado.

---

## SEGURIDAD (Sprint 0 completado)

Ver `GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` para el análisis completo. Implementado:

| Fix | Descripción |
|-----|-------------|
| Rate limiting | slowapi: 20/min chart, 5/min transits, 10/min SR |
| Non-root Docker | Usuario `astro` uid=1000 en contenedor |
| CORS exacto | `FRONTEND_URL` env var reemplaza regex wildcard en producción |
| Error handling | Stack traces no se exponen al cliente; logging centralizado |
| Validación fechas | `date.fromisoformat()` valida semánticamente; rango 1800-2200 |
| Límite de rango | Tránsitos: máximo 366 días por request/año |
| Swagger oculto | `/docs` y `/redoc` deshabilitados cuando `ENV=production` |

**Pendiente (Sprint 1 y 2):** ver `GAP_ANALYSIS_DEPLOY.md` secciones Alto y Medio.
