/**
 * Cloudflare Worker — безопасный прокси для отправки RSVP в Telegram.
 * Токен бота хранится в секретах воркера и не попадает в код сайта.
 *
 * Развёртывание (бесплатно):
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker → вставьте этот файл.
 *   2. Settings → Variables and Secrets, добавьте:
 *        BOT_TOKEN      — токен от @BotFather (Secret)
 *        CHAT_ID        — ваш chat_id (узнать у @userinfobot)
 *        ALLOWED_ORIGIN — адрес сайта, напр. https://username.github.io
 *   3. Адрес воркера (https://xxx.workers.dev) укажите в VITE_RSVP_ENDPOINT.
 */
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    let p;
    try {
      p = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: cors });
    }

    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const name = esc(String(p.name || "").slice(0, 80));
    const guests = Math.max(0, Math.min(10, Number(p.guests) || 0));
    const text =
      `💌 <b>Новый ответ на приглашение</b>\n\n👤 <b>${name}</b>\n` +
      (p.attending ? `✅ Придёт\n👥 Гостей: <b>${guests}</b>` : `❌ Не сможет прийти`);

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML" }),
    });
    return new Response(tg.ok ? "ok" : "telegram error", { status: tg.ok ? 200 : 502, headers: cors });
  },
};
