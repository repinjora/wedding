import { useEffect, useRef, useState } from "react";
import { Reveal } from "./ui";

const VIDEO_URL = `${import.meta.env.BASE_URL}videos/proposal.mp4`;
const POSTER_URL = `${import.meta.env.BASE_URL}images/scene.jpg`;

/** A silent, scroll-triggered memory from the day of the proposal. */
export default function ProposalMemory() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Keep the proposal video silent even when the browser exposes its audio track.
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true;
          void video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <section className="section proposal" aria-labelledby="proposal-title">
      <Reveal className="proposal-copy">
        <p className="eyebrow">13 · 12 · 2025 — THE QUESTION</p>
        <h2 className="proposal-title" id="proposal-title">Тот самый вопрос</h2>
        <p className="proposal-text">
          Ровно за год до этого вечера началась новая глава нашей истории.
          13 декабря 2025 года Георгий сделал Еве предложение.
        </p>
      </Reveal>

      <Reveal className="proposal-film" delay={0.15}>
        <div className="proposal-frame">
          <video
            ref={videoRef}
            className="proposal-video"
            src={VIDEO_URL}
            poster={POSTER_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-label="Момент предложения Георгия Еве, 13 декабря 2025 года. Видео без звука."
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <div className="proposal-film-shade" />
          <div className="proposal-film-caption">
            <span>ОДИН ГОД ДО НАШЕЙ ВСТРЕЧИ</span>
            <strong>13 декабря 2025</strong>
          </div>
          <button
            className={`proposal-control ${playing ? "is-playing" : ""}`}
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Приостановить видео" : "Воспроизвести видео без звука"}
            title={playing ? "Пауза" : "Воспроизвести без звука"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6z" /></svg>
            )}
          </button>
        </div>
        <p className="proposal-note">Этот кадр мы бережно храним в сердце</p>
      </Reveal>
    </section>
  );
}
