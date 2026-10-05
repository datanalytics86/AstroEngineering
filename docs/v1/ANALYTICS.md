# ANALYTICS — PostHog cookieless

Dueño: A7. Fecha: 2026-10-05 (Oleada 2).

## Qué se manda

Eventos de embudo sin PII de nacimiento ni email. `distinct_id` en `sessionStorage` (`ae_ph_id`). `$process_person_profile: false`.

Eventos: `landing_viewed`, `form_started`, `place_selected`, `chart_created`, `topics_opened`, `paywall_viewed`, `checkout_started`, `purchase_completed`, `pro_content_viewed`, `pdf_downloaded`, `ics_downloaded`, `share_clicked`, `gift_purchased`, `waitlist_joined`.

`?ref=` se guarda en cookie HttpOnly `ae_ref` (60 días) y en `sessionStorage`. Checkout lo persiste en la orden. Cupón real del proveedor 🛑 D1; mock usa `REF_<CODE>`.

## Cómo se apaga

Sin `NEXT_PUBLIC_POSTHOG_KEY` el cliente es no-op. CSP abre `*.posthog.com` / `us.i.posthog.com` / `eu.i.posthog.com`.

## Opt-in

Waitlist: `POST /api/optin` con consentimiento. Double confirm en `/api/optin/confirm`. No se guarda email de waitlist en localStorage.

## Cuenta

Crear proyecto PostHog y pegar la key en Vercel es runbook humano (D5). Hasta entonces no hay medición en producción.
