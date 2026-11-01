import { useState } from "react";
import type { FormEvent } from "react";
import { RsvpNotConfiguredError, sendRsvp } from "../rsvp";
import { Reveal, Words } from "./ui";

type Status = "idle" | "sending" | "ok" | "err";

/** СЦЕНА 6 — подтверждение присутствия */
export default function Rsvp() {
  const [name, setName] = useState("");
  const [att, setAtt] = useState<"yes" | "no" | null>(null);
  const [guests, setGuests] = useState(1);
  const [hp, setHp] = useState(""); // honeypot от ботов
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ name: string; att: boolean } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (hp || status === "sending") return;

    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.split(" ").length < 2) {
      setError("Пожалуйста, укажите имя и фамилию.");
      setStatus("err");
      return;
    }
    if (!att) {
      setError("Пожалуйста, выберите: придёте вы или нет.");
      setStatus("err");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      await sendRsvp({ name: clean, attending: att === "yes", guests: att === "yes" ? guests : 0 });
      setSent({ name: clean, att: att === "yes" });
      setStatus("ok");
    } catch (err) {
      setError(
        err instanceof RsvpNotConfiguredError
          ? "Отправка ответов пока не подключена к Telegram. Владельцам сайта: добавьте токен бота и chat_id (файл src/config.ts, см. README)."
          : "Не удалось отправить ответ. Проверьте интернет и попробуйте ещё раз."
      );
      setStatus("err");
    }
  };

  return (
    <section id="rsvp" className="section rsvp">
      <Reveal className="ornament">
        <span />
      </Reveal>

      <Reveal as="div">
        <Words
          as="h2"
          className="rsvp-title"
          text="Мы очень хотим знать, кто разделит с нами этот вечер!"
          delay={0.1}
          step={0.07}
        />
      </Reveal>

      {status === "ok" && sent ? (
        <div className="rsvp-thanks">
          <svg viewBox="0 0 52 52" width="56" height="56" aria-hidden="true">
            <circle cx="26" cy="26" r="24" className="t-circle" />
            <path d="M15 27l8 8 14-16" className="t-check" />
          </svg>
          <p className="thanks-title">Спасибо, {sent.name.split(" ")[0]}!</p>
          <p className="thanks-text">
            {sent.att
              ? "Ваш ответ получен. Мы с нетерпением ждём встречи!"
              : "Ваш ответ получен. Нам будет вас не хватать — спасибо, что сообщили."}
          </p>
        </div>
      ) : (
        <Reveal as="div" delay={0.15}>
          <form className="rsvp-form" onSubmit={submit} noValidate>
            <label className="field">
              <span>Имя и фамилия</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                enterKeyHint="next"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Анна Иванова"
                maxLength={80}
              />
            </label>

            <fieldset className="field">
              <legend>Вы придёте?</legend>
              <div className="seg" role="radiogroup">
                <button
                  type="button"
                  role="radio"
                  aria-checked={att === "yes"}
                  className={att === "yes" ? "active" : ""}
                  onClick={() => setAtt("yes")}
                >
                  Приду
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={att === "no"}
                  className={att === "no" ? "active" : ""}
                  onClick={() => setAtt("no")}
                >
                  Не смогу прийти
                </button>
              </div>
            </fieldset>

            <div className={`guests-wrap ${att === "yes" ? "open" : ""}`}>
              <div className="guests-inner">
                <div className="field">
                  <span className="legend-like">Количество гостей (включая вас)</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Меньше" disabled={guests <= 1}>
                      −
                    </button>
                    <output aria-live="polite">{guests}</output>
                    <button type="button" onClick={() => setGuests((g) => Math.min(6, g + 1))} aria-label="Больше" disabled={guests >= 6}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <input
              type="text"
              name="website"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hp"
            />

            {status === "err" && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-gold" disabled={status === "sending"}>
              <span>{status === "sending" ? "ОТПРАВЛЯЕМ…" : "ОТПРАВИТЬ ОТВЕТ"}</span>
            </button>
          </form>
        </Reveal>
      )}
    </section>
  );
}
