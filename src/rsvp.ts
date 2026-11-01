import { RSVP } from "./config";

export type RsvpPayload = {
  name: string;
  attending: boolean;
  guests: number;
};

export class RsvpNotConfiguredError extends Error {
  constructor() {
    super("RSVP is not configured");
    this.name = "RsvpNotConfiguredError";
  }
}

export const isRsvpConfigured = () =>
  Boolean(RSVP.proxyUrl || (RSVP.telegramBotToken && RSVP.telegramChatId));

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

/** Реальная отправка. Ничего не имитирует: если не настроено — бросает RsvpNotConfiguredError. */
export async function sendRsvp(p: RsvpPayload): Promise<void> {
  if (!isRsvpConfigured()) {
    console.error(
      "[RSVP] Отправка не настроена. Заполните VITE_RSVP_ENDPOINT или VITE_TELEGRAM_BOT_TOKEN + VITE_TELEGRAM_CHAT_ID (см. src/config.ts)."
    );
    throw new RsvpNotConfiguredError();
  }

  const t = withTimeout(15000);
  try {
    if (RSVP.proxyUrl) {
      const res = await fetch(RSVP.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, sentAt: new Date().toISOString() }),
        signal: t.signal,
      });
      if (!res.ok) throw new Error(`Proxy responded ${res.status}`);
      return;
    }

    const text =
      `💌 <b>Новый ответ на приглашение</b>\n\n` +
      `👤 <b>${esc(p.name)}</b>\n` +
      (p.attending
        ? `✅ Придёт\n👥 Гостей: <b>${p.guests}</b>`
        : `❌ Не сможет прийти`);

    // x-www-form-urlencoded — «простой» запрос без CORS-preflight
    const body = new URLSearchParams({
      chat_id: RSVP.telegramChatId,
      text,
      parse_mode: "HTML",
    });
    const res = await fetch(
      `https://api.telegram.org/bot${RSVP.telegramBotToken}/sendMessage`,
      { method: "POST", body, signal: t.signal }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(`Telegram error: ${data?.description ?? res.status}`);
    }
  } finally {
    t.done();
  }
}
