/**
 * PostHog cookieless (memory). Sin PII de nacimiento ni email.
 * Sin key: no-op. Envuelve trackLearning.
 */

export type AnalyticsEvent =
  | "landing_viewed"
  | "form_started"
  | "place_selected"
  | "chart_created"
  | "topics_opened"
  | "paywall_viewed"
  | "pro_preview_opened"
  | "checkout_started"
  | "purchase_completed"
  | "pro_content_viewed"
  | "pdf_downloaded"
  | "ics_downloaded"
  | "share_clicked"
  | "gift_purchased"
  | "refund_issued"
  | "waitlist_joined";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

function anonId(): string {
  try {
    const k = "ae_ph_id";
    let id = sessionStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  if (!KEY) return;
  const distinct_id = anonId();
  const payload = {
    api_key: KEY,
    event,
    properties: {
      ...props,
      distinct_id,
      $process_person_profile: false,
    },
  };
  void fetch(`${HOST.replace(/\/$/, "")}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function analyticsId(): string {
  if (typeof window === "undefined") return "";
  return anonId();
}
