import { useEffect, useRef } from "react";
import { coupleUrl, sceneUrl } from "../assets";
import { EVENT } from "../config";
import { Letters } from "./ui";
import type { CSSVars } from "./ui";

/** СЦЕНА 2 — главный экран */
export default function Hero({ go }: { go: boolean }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      el.style.setProperty("--hs", Math.min(window.scrollY, window.innerHeight * 1.3).toFixed(1));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const d = (s: number) => ({ "--d": `${s}s` }) as CSSVars;

  return (
    <section
      ref={ref}
      className={`hero ${go ? "go" : ""} ${coupleUrl ? "has-photo" : "has-scene"}`}
      aria-label="Главный экран"
    >
      <div className="hero-media">
        <div className="hero-par">
          {coupleUrl ? (
            <div className="photo-frame">
              <img className="couple-img" src={coupleUrl} alt="Георгий и Ева" decoding="async" />
              <div className="grade-color" />
              <div className="grade-warm" />
            </div>
          ) : (
            <div className="scene-frame">
              <img className="scene-img" src={sceneUrl} alt="Георгий и Ева в зимнем лесу" decoding="async" />
              <div className="grade-warm soft" />
            </div>
          )}
        </div>
      </div>

      <div className="hero-shade" />

      <div className="hero-content">
        <h2 className="hero-names">
          <span className="line">
            <Letters text={EVENT.groom} delay={1.5} step={0.1} />
          </span>
          <span className="line amp-line">
            <span className="amp ch" style={{ "--i": 0, "--d": "2.4s", "--s": "0.1s" } as CSSVars}>
              &amp;
            </span>
            <Letters text={EVENT.bride} delay={2.7} step={0.12} />
          </span>
        </h2>

        <div className="hero-bottom">
          <p className="hero-tagline fade" style={d(3.9)}>
            И теперь мы хотим разделить этот вечер с вами
          </p>
          <div className="hero-rule fade" style={d(4.8)} />
          <p className="hero-invite fade" style={d(5.3)}>
            ПРИГЛАШАЕМ НА НАШ ПРАЗДНИК
          </p>
          <p className="hero-date fade" style={d(5.9)}>
            {EVENT.dateLabel}
          </p>
        </div>

        <a href="#invitation" className="scroll-hint fade" style={d(7.2)} aria-label="Листайте вниз">
          <span>листайте</span>
          <i />
        </a>
      </div>
    </section>
  );
}
