# Contratos v1 — Oleada 0 (refino de SPEC §5.2)

Fecha: 2026-10-05  
Dueños: A3 (cálculo / places / TZ), A4 (billing / entitlements / pro JSON), A5 (consumo UI), A6 (`YearMapContent` copy), A7 (`SITE_URL` / eventos).

Nada de esto se implementa en Oleada 0. Oleada 1 no consume billing. A5 de Oleada 1 no espera estos contratos; A5 de Oleada 2 sí.

## 1. Catálogo

Archivo futuro: `frontend/lib/billing/catalog.ts`

```ts
type Sku =
  | "year_map"          // 12 meses móviles — producto núcleo, enabled
  | "year_map_next"     // calendario año+1; activeFrom "11-01" activeTo "01-31"
  | "year_map_gift"     // P1
  | "extra_map"         // order bump
  | "plus_monthly"      // D10 apagado
  | "plus_yearly";      // D10 apagado

interface Product {
  sku: Sku;
  kind: "one_time" | "subscription";
  window: "rolling12" | "next_calendar_year" | "none";
  prices: Partial<Record<"USD" | "CLP", number>>; // unidades menores (CLP sin decimales)
  enabled: boolean;
  activeFrom?: string; // "MM-DD"
  activeTo?: string;
}

const CATALOG: Record<Sku, Product> = {
  year_map: {
    sku: "year_map", kind: "one_time", window: "rolling12",
    prices: { USD: 999, CLP: 8990 }, enabled: true,
  },
  year_map_next: {
    sku: "year_map_next", kind: "one_time", window: "next_calendar_year",
    prices: { USD: 999, CLP: 8990 }, enabled: true,
    activeFrom: "11-01", activeTo: "01-31",
  },
  year_map_gift: {
    sku: "year_map_gift", kind: "one_time", window: "rolling12",
    prices: { USD: 999, CLP: 8990 }, enabled: false, // P1
  },
  extra_map: {
    sku: "extra_map", kind: "one_time", window: "rolling12",
    prices: { USD: 599, CLP: 5490 }, enabled: true,
  },
  plus_monthly: {
    sku: "plus_monthly", kind: "subscription", window: "none",
    prices: { USD: 499, CLP: 4490 }, enabled: false,
  },
  plus_yearly: {
    sku: "plus_yearly", kind: "subscription", window: "none",
    prices: { USD: 2999, CLP: 26990 }, enabled: false,
  },
};
```

Reglas:

- Ningún precio en `es.ts` / `en.ts` / UI. Copy usa `t(key, { price })`.
- IDs de precio del proveedor: env `PROVIDER_PRICE_IDS` JSON, no el catálogo.
- Moneda: CLP si `x-vercel-ip-country=CL` **y** el proveedor lo soporta; si no, USD.

## 2. BillingProvider

Archivo futuro: `frontend/lib/billing/provider.ts`

```ts
type ProviderId = "stripe" | "lemonsqueezy" | "mercadopago" | "mock";

interface BillingProvider {
  id: ProviderId;
  enabled(): boolean;
  createCheckout(i: {
    orderId: string; sku: Sku; currency: "USD" | "CLP";
    email?: string; locale: "es" | "en";
    successUrl: string; cancelUrl: string;
  }): Promise<{ url: string }>;
  verifyAndParseWebhook(req: Request): Promise<BillingEvent | null>;
}

interface BillingEvent {
  eventId: string;
  type: "paid" | "refunded" | "chargeback";
  orderId: string;
  providerOrderId: string;
  email: string;
  amountMinor: number;
  currency: string;
}
```

Selección: `BILLING_PROVIDER` env. En `PRO_MODE=waitlist` o `dev` sin credenciales → `mock`. `lemonsqueezy.enabled()` es false hasta D1 escrito.

Success/cancel: solo orígenes de `SITE_URL` (H-07). Previews: solo si `VERCEL_ENV=preview` y el host es del proyecto.

## 3. Rutas frontend nuevas (Oleada 2)

| Ruta | Auth | Contrato |
|------|------|----------|
| `POST /api/billing/checkout` | público, rate-limit borde | Body `{sku, birth: BirthData & {tz_name}, email?, locale, ref?, ph_id?}`. Crea `orders.status=pending` con `birth_enc`. Cookie HttpOnly `ae_pending_order`. Return `{url}`. |
| `POST /api/billing/webhook/[provider]` | firma del proveedor | Idempotencia `webhook_events(provider, event_id)`. `paid` → customer + chart + entitlement + email magic link. `refunded`/`chargeback` → `revoked_at`. |
| `GET /api/billing/status` | público | `{mode: "live"\|"waitlist"\|"dev", provider, currency}` |
| `GET /api/pro/order-status` | cookie `ae_pending_order` | Si `paid`, emite `ae_session`. |
| `POST /api/auth/magic-link` | público | Siempre 204. 3/h email, 10/h IP. |
| `GET /api/auth/verify?token=` | token | Cookie `ae_session` (HttpOnly, Secure, SameSite=Lax, 30 d) → `/mis-mapas`. |
| `POST /api/auth/logout` | sesión | — |
| `GET /api/pro/entitlements` | sesión | `[{sku, chart_id, window_start, window_end}]` |
| `POST /api/pro/year-map` | sesión + derecho | `YearMapContent v2` o **403**. Nunca en el cliente sin este JSON. |
| `GET /api/pro/year-map.ics?chart_id=` | sesión + derecho | iCal de `keyDates`. |
| `GET /api/places?q=&lang=&limit=` | público, caché 1 d | Proxy al backend. |

`PRO_MODE=live|waitlist|dev`:

- `live`: checkout real; sin derecho → 403 y UI wait/paywall.
- `waitlist`: CTA “Avísame cuando abra”; email en servidor con consentimiento.
- `dev`: solo `VERCEL_ENV!=production` y `NODE_ENV!=production`.

Invariante: **ningún camino** llama `unlockPro` soft en `live`/`waitlist`.

## 4. YearMapContent v2

Extiende `frontend/lib/year-map.ts`. Lo genera el servidor (A4-6) con módulos `server-only`. A6 es dueño de la forma del copy.

```ts
interface YearMapContentV2 {
  window: { start: "YYYY-MM"; end: "YYYY-MM"; kind: "rolling12" | "calendar" };
  climateMode: "relative";
  months: Array<{
    key: "YYYY-MM";           // cruza el año
    label: string;            // "Oct 2026"
    climate: "apretado" | "abierto" | "suave" | "parejo";
    relativeIntensity: number; // 2–9, min/max del año
    headline: string;
    action: string;
    avoid: string;
    areas: Partial<Record<TopicId, string>>;
  }>;
  keyDates: Array<{
    date: "YYYY-MM-DD";
    endDate?: "YYYY-MM-DD";
    title: string;
    areas: TopicId[];
    tone: "tenso" | "armonico" | "neutro";
    why?: string;
    technical?: { transit: string; aspect: string; natal: string };
  }>;
  solar?: SolarYearTone;
}
```

Clima relativo (A6-1), no umbral 6.5:

- ordenar 12 meses por `raw_intensity` (z robusto mediana/MAD)
- apretado = top 3 o z ≥ +1 con mayoría tensa
- suave = bottom 3 o z ≤ −1
- abierto = resto
- serie plana → `parejo` y copy honesto

## 5. Backend — cambios de contrato (Oleada 1 = A3)

### `POST /api/chart`

Request (hoy `BirthData`; se extiende, no se rompe):

```ts
interface ChartRequest {
  name: string;
  birth_date: "YYYY-MM-DD";
  birth_time: "HH:MM";
  latitude: number;
  longitude: number;
  timezone_offset: number;     // override manual, se mantiene
  tz_name?: string;            // IANA, nuevo, opcional
}
```

Response extra: `tz_name`, `utc_offset_used`, `tz_warning?`, `chart_warning?` (p. ej. Quirón omitido).

### `GET /api/places`

Query: `q` (min 2), `lang=es|en`, `limit` default 8 max 15.

```ts
interface PlaceHit {
  id: string;
  name: string;
  admin1: string;
  country_code: string;
  country_name: string;
  lat: number;
  lon: number;
  tz: string;          // IANA
  population: number;
}
```

Aceptación: “santiago”, “nueva york”, “punta arenas” → zona correcta.

### `POST /api/transits`

Request: `natal_planets` **1..20** (A2-2). Rango ≤ 366 d (ya existe).

Response extra:

```ts
raw_intensity: number[]     // 12 valores, SIN min(10)
key_events: Array<{
  date: "YYYY-MM-DD";
  kind: "eclipse_solar" | "eclipse_lunar" | "lunation";
  natal: string;            // cuerpo natal tocado
  orb: number;
}>
```

`intensity_score` mensual se conserva por compatibilidad (clip 0–10). A6 usa `raw_intensity`.

### Proxy firmado (A2-1)

Headers Next → FastAPI:

- `X-Astro-Proxy-Key: $BACKEND_PROXY_KEY`
- `X-Astro-Client-IP: <primer hop de x-forwarded-for en Vercel>`

Prod: 403 sin secreto, excepto `GET /health`. `key_func` de slowapi usa la IP firmada.

## 6. Modelo Postgres (Oleada 2, A4-1)

Tal cual SPEC §5.1: `customers`, `charts` (`fingerprint` HMAC-SHA256 + `birth_enc` AES-256-GCM), `orders`, `entitlements`, `webhook_events`, `magic_tokens`, `email_optins`. `gifts` P1.

Retención: nacimiento se borra a pedido; `magic_tokens` 7 d; `orders.pending` 48 h. No se guarda nada de quien no compra ni da opt-in.

## 7. Eventos de analítica (A7-1)

`landing_viewed → form_started → place_selected → chart_created → topics_opened → paywall_viewed → pro_preview_opened → checkout_started → purchase_completed (server) → pro_content_viewed → pdf_downloaded / ics_downloaded → share_clicked → gift_purchased (server) → refund_issued (server)`.

PII: nunca nombre, fecha/hora de nacimiento, coordenadas ni email en claro. `ph_id` anónimo en metadata del checkout.

## 8. SITE_URL

Un solo módulo `frontend/lib/site.ts` (A1-6, coordinado con A7). Reemplaza:

| Hoy | Archivo:línea |
|-----|----------------|
| `SITE_ORIGIN` | `frontend/lib/tier-minus1.ts:25` |
| `SAMPLE_CTA` | `frontend/lib/pro-sample.ts:53` |
| `SITE` | `frontend/lib/share.ts:3` |
| allowlist + fallback | `frontend/lib/stripe-server.ts:21,31` |
| sitemap | `frontend/app/sitemap.ts:4` |
| robots | `frontend/app/robots.ts:10` |

Hasta D3: `https://astro-engineering.vercel.app`.
