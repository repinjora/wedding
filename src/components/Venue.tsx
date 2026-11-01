import { EVENT, MAP_URL } from "../config";
import { Reveal } from "./ui";

/** СЦЕНА 4 — дата и место */
export default function Venue() {
  return (
    <section className="section venue">
      <Reveal className="eyebrow">Дата и место</Reveal>

      <Reveal className="venue-card" delay={0.1}>
        <div className="card-glow" aria-hidden="true" />

        <p className="venue-date">{EVENT.dateLabel}</p>
        <div className="hair" />
        <p className="venue-label">НАЧАЛО СБОРА ГОСТЕЙ — {EVENT.gatherTime}</p>

        <h3 className="venue-name">{EVENT.venueName}</h3>
        <p className="venue-text">Место проведения: {EVENT.venueNameText}.</p>
        {EVENT.address && <p className="venue-address">{EVENT.address}</p>}

        <a className="btn-outline" href={MAP_URL} target="_blank" rel="noopener noreferrer">
          <span>ПОСМОТРЕТЬ НА КАРТЕ</span>
        </a>
      </Reveal>
    </section>
  );
}
