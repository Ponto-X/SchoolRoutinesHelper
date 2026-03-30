import { getConfig } from "./config";

export interface SendResult {
  ok: boolean;
  provider?: string;
  error?: string;
}

/** Normaliza número para formato Evolution API: apenas dígitos, com DDI 55 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Se já tem 55 no início e tem 12-13 dígitos, está ok
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Se tem 10-11 dígitos (DDD + número), adiciona 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendResult> {
  const cfg = await getConfig();
  const provider = cfg.VITE_WHATSAPP_PROVIDER || "none";

  // ── Evolution API v2 ───────────────────────────────────────────────────────
  if (provider === "evolution") {
    const baseUrl  = cfg.VITE_EVOLUTION_API_URL;
    const apiKey   = cfg.VITE_EVOLUTION_API_KEY;
    const instance = cfg.VITE_EVOLUTION_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
      return { ok: false, provider: "evolution", error: "Variáveis da Evolution API não configuradas." };
    }

    const normalizedPhone = normalizePhone(phone);

    try {
      const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: message,
          // Evolution API v2 aceita também delay opcional
          delay: 1000,
        }),
      });

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          errMsg = err?.message || err?.error || JSON.stringify(err) || errMsg;
        } catch { /* ignore */ }
        return { ok: false, provider: "evolution", error: errMsg };
      }

      return { ok: true, provider: "evolution" };
    } catch (e) {
      return { ok: false, provider: "evolution", error: String(e) };
    }
  }

  // ── Meta WhatsApp Cloud API ────────────────────────────────────────────────
  if (provider === "meta") {
    const token         = cfg.VITE_EVOLUTION_API_KEY;
    const phoneNumberId = cfg.VITE_EVOLUTION_INSTANCE;

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
          to: normalizePhone(phone),
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
