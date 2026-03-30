import { getConfig } from "./config";

export interface SendResult {
  ok: boolean;
  provider?: string;
  error?: string;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendResult> {
  const cfg = await getConfig();
  const provider = cfg.VITE_WHATSAPP_PROVIDER || "none";

  // ── Evolution API ──────────────────────────────────────────────────────────
  if (provider === "evolution") {
    const baseUrl  = cfg.VITE_EVOLUTION_API_URL;
    const apiKey   = cfg.VITE_EVOLUTION_API_KEY;
    const instance = cfg.VITE_EVOLUTION_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
      return { ok: false, provider: "evolution", error: "VITE_EVOLUTION_API_URL, VITE_EVOLUTION_API_KEY ou VITE_EVOLUTION_INSTANCE não configurados." };
    }

    try {
      const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": apiKey },
        body: JSON.stringify({ number: phone, text: message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, provider: "evolution", error: (err as Record<string, unknown>).message as string || `HTTP ${res.status}` };
      }
      return { ok: true, provider: "evolution" };
    } catch (e) {
      return { ok: false, provider: "evolution", error: String(e) };
    }
  }

  // ── Meta WhatsApp Cloud API ────────────────────────────────────────────────
  if (provider === "meta") {
    const token         = cfg.VITE_EVOLUTION_API_KEY; // reuse key field for meta token
    const phoneNumberId = cfg.VITE_EVOLUTION_INSTANCE; // reuse instance field for phone number id

    if (!token || !phoneNumberId) {
      return { ok: false, provider: "meta", error: "Token ou Phone Number ID não configurados." };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, provider: "meta", error: JSON.stringify(err) };
      }
      return { ok: true, provider: "meta" };
    } catch (e) {
      return { ok: false, provider: "meta", error: String(e) };
    }
  }

  return {
    ok: false,
    provider: "none",
    error: "WhatsApp não configurado. Defina VITE_WHATSAPP_PROVIDER no Railway.",
  };
}
