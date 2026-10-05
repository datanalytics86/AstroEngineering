/**
 * Thin Resend client. No-op without RESEND_API_KEY + EMAIL_FROM.
 * Used for magic link, gifts, monthly reminder, and PDF attachment.
 */

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}): Promise<{ sent: boolean; skipped?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) return { sent: false, skipped: "email_unconfigured" };
  const to = opts.to.trim().toLowerCase();
  if (!to.includes("@") || !to.includes(".")) return { sent: false, skipped: "invalid_to" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        attachments: opts.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          content_type: a.contentType || "application/pdf",
        })),
      }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false, skipped: "network" };
  }
}

export function emailCopy(locale: string) {
  const en = locale === "en";
  return {
    purchaseSubject: en ? "Your Year Map is ready — AstroEngine" : "Tu Mapa del Año está listo — AstroEngine",
    purchaseText: (url: string) =>
      en
        ? `Open your map with this link (one use, 20 minutes):\n${url}\n\nIf it expires, request a new one from My maps.`
        : `Abre tu mapa con este enlace (un solo uso, 20 minutos):\n${url}\n\nSi vence, pide uno nuevo en Mis mapas.`,
    giftBuyerSubject: en ? "Gift scheduled — AstroEngine" : "Regalo programado — AstroEngine",
    giftBuyerText: (when: string) =>
      en
        ? `We will email the recipient on ${when}. They redeem with a private code. You do not receive a Year Map from this purchase.`
        : `Le escribimos a quien lo recibe el ${when}. Canjea con un código privado. Esta compra no abre un mapa para ti.`,
    giftRecipientSubject: en ? "Someone gifted you a Year Map — AstroEngine" : "Te regalaron un Mapa del Año — AstroEngine",
    giftRecipientText: (url: string) =>
      en
        ? `Redeem your Year Map here:\n${url}\n\nYou will enter your birth data to generate it. Orientation and entertainment; not medical or financial advice.`
        : `Canjea tu Mapa del Año aquí:\n${url}\n\nVas a ingresar tus datos de nacimiento para generarlo. Orientación y entretenimiento; no es consejo médico ni financiero.`,
    monthlySubject: en ? "Your month on the Year Map — AstroEngine" : "Tu mes en el Mapa del Año — AstroEngine",
    monthlyText: (url: string) =>
      en
        ? `A short reminder: open your Year Map and look at this month.\n${url}\n\nYou can turn this off by writing to support.`
        : `Un recordatorio breve: abre tu Mapa del Año y mira este mes.\n${url}\n\nPara no recibirlo más, escribe a soporte.`,
  };
}
