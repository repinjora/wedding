import { useEffect, useState } from "react";
import { EVENT } from "../config";
import { Reveal } from "./ui";

const TARGET = new Date(EVENT.startISO).getTime();

const plural = (n: number, forms: [string, string, string]) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
};

function Unit({ value, label, progress, pad = 2 }: { value: number; label: string; progress: number; pad?: number }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <div className="cd-unit">
      <div className="cd-ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={R} className="cd-track" />
          <circle
            cx="50"
            cy="50"
            r={R}
            className="cd-bar"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
          />
        </svg>
        <span key={value} className="cd-digit">
          {String(value).padStart(pad, "0")}
        </span>
      </div>
      <span className="cd-label">{label}</span>
    </div>
  );
}

/** СЦЕНА 5 — обратный отсчёт до 13.12.2026 17:00 (МСК) */
export default function Countdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let id: number;
    const tick = () => {
      setNow(Date.now());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(id);
  }, []);

  const diff = Math.max(0, TARGET - now);
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const over = diff === 0;

  return (
    <section className="section countdown">
      <Reveal className="eyebrow">До нашего вечера осталось</Reveal>

      {over ? (
        <Reveal className="cd-over" delay={0.1}>
          Праздник начался ✦
        </Reveal>
      ) : (
        <Reveal className="cd-grid" delay={0.1}>
          <Unit value={days} label={plural(days, ["день", "дня", "дней"])} progress={days / 365} pad={days > 99 ? 3 : 2} />
          <Unit value={hours} label={plural(hours, ["час", "часа", "часов"])} progress={hours / 24} />
          <Unit value={minutes} label={plural(minutes, ["минута", "минуты", "минут"])} progress={minutes / 60} />
          <Unit value={seconds} label={plural(seconds, ["секунда", "секунды", "секунд"])} progress={seconds / 60} />
        </Reveal>
      )}

      <Reveal className="cd-note" delay={0.2}>
        {EVENT.dateLabel.toLowerCase()} · {EVENT.gatherTime}
      </Reveal>
    </section>
  );
}
