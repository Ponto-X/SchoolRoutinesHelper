/**
 * WhatsApp sender — suporta múltiplos providers.
 * Configurado via variáveis de ambiente no Railway:
 *
 * Provider 1 — Evolution API (recomendado para Brasil):
 *   VITE_WHATSAPP_PROVIDER=evolution
 *   VITE_EVOLUTION_API_URL=https://sua-evolution.railway.app
 *   VITE_EVOLUTION_API_KEY=sua-api-key
 *   VITE_EVOLUTION_INSTANCE=nome-da-instancia
 *
 * Provider 2 — WhatsApp Cloud API (Meta oficial):
 *   VITE_WHATSAPP_PROVIDER=meta
 *   VITE_META_WA_TOKEN=seu-token
 *   VITE_META_PHONE_NUMBER_ID=seu-phone-number-id
 *
 * Provider 3 — Stevo (via webhook de disparo):
 *   VITE_WHATSAPP_PROVIDER=stevo
 *   VITE_STEVO_API_KEY=sua-chave
 *   VITE_STEVO_INSTANCE_ID=id-da-instancia
 */

export interface SendResult {
  ok: boolean;
  provider?: string;
  error?: string;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendResult> {
  const provider = import.meta.env.VITE_WHATSAPP_PROVIDER || "none";

  // ── Evolution API ──────────────────────────────────────────────────────────
  if (provider === "evolution") {
    const baseUrl  = import.meta.env.VITE_EVOLUTION_API_URL;
    const apiKey   = import.meta.env.VITE_EVOLUTION_API_KEY;
    const instance = import.meta.env.VITE_EVOLUTION_INSTANCE;

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
    const token         = import.meta.env.VITE_META_WA_TOKEN;
    const phoneNumberId = import.meta.env.VITE_META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return { ok: false, provider: "meta", error: "VITE_META_WA_TOKEN ou VITE_META_PHONE_NUMBER_ID não configurados." };
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
        return { ok: false, provider: "meta", error: JSON.stringify((err as Record<string, unknown>).error || err) };
      }
      return { ok: true, provider: "meta" };
    } catch (e) {
      return { ok: false, provider: "meta", error: String(e) };
    }
  }

  // ── Stevo (disparo via API interna) ───────────────────────────────────────
  if (provider === "stevo") {
    const apiKey     = import.meta.env.VITE_STEVO_API_KEY;
    const instanceId = import.meta.env.VITE_STEVO_INSTANCE_ID;

    if (!apiKey || !instanceId) {
      return { ok: false, provider: "stevo", error: "VITE_STEVO_API_KEY ou VITE_STEVO_INSTANCE_ID não configurados." };
    }

    try {
      const res = await fetch(`https://api.stevo.chat/manager/v2/instance/${instanceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ phone, message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, provider: "stevo", error: (err as Record<string, unknown>).message as string || `HTTP ${res.status}` };
      }
      return { ok: true, provider: "stevo" };
    } catch (e) {
      return { ok: false, provider: "stevo", error: String(e) };
    }
  }

  // ── Nenhum provider configurado ───────────────────────────────────────────
  return {
    ok: false,
    provider: "none",
    error: "Nenhum provider WhatsApp configurado. Defina VITE_WHATSAPP_PROVIDER no Railway.",
  };
}
