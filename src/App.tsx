import { useCallback, useEffect, useRef, useState } from "react";
import { MusicEngine } from "./audio/music";
import Atmosphere from "./components/Atmosphere";
import Countdown from "./components/Countdown";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Invitation from "./components/Invitation";
import ProposalMemory from "./components/ProposalMemory";
import Rsvp from "./components/Rsvp";
import SoundControl from "./components/SoundControl";
import Venue from "./components/Venue";
import { EVENT } from "./config";

type Stage = "intro" | "leaving" | "story";
type Sound = "unset" | "on" | "off";

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [sound, setSound] = useState<Sound>("unset");
  const [ready, setReady] = useState(false);
  const engine = useRef<MusicEngine | null>(null);
  const soundRef = useRef<Sound>("unset");
  soundRef.current = sound;

  // Кнопка «Войти» появляется после киновступления
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 9800);
    return () => window.clearTimeout(id);
  }, []);

  // Пока идёт вступление — прокрутка заблокирована
  useEffect(() => {
    document.documentElement.classList.toggle("locked", stage !== "story");
  }, [stage]);

  const soundOn = useCallback(async () => {
    if (!engine.current) engine.current = new MusicEngine();
    try {
      await engine.current.start();
      setSound("on");
    } catch (e) {
      console.warn("Не удалось запустить звук", e);
      setSound("off");
    }
  }, []);

  const soundOff = useCallback(() => {
    engine.current?.pause();
    setSound("off");
  }, []);

  const enter = useCallback(() => {
    if (stage !== "intro") return;

    // Нажатие — это жест пользователя: можно безопасно запросить звук и датчики наклона
    if (soundRef.current === "unset") void soundOn();
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      DOE?.requestPermission?.().catch(() => undefined);
    } catch {
      /* ignore */
    }

    setStage("leaving");
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      setStage("story");
    }, 2000);
  }, [stage, soundOn]);

  return (
    <>
      <Atmosphere push={stage === "leaving"} />

      {stage === "intro" || stage === "leaving" ? (
        <Intro leaving={stage === "leaving"} ready={ready} onEnter={enter} />
      ) : null}

      {stage !== "intro" && (
        <main className="story">
          <Hero go={stage === "story"} />
          <ProposalMemory />
          <Invitation />
          <Venue />
          <Countdown />
          <Rsvp />
          <footer className="footer">
            <p className="footer-names">
              {EVENT.groom} <em>&amp;</em> {EVENT.bride}
            </p>
            <p className="footer-date">13 · 12 · 2026</p>
          </footer>
        </main>
      )}

      <SoundControl sound={sound} stage={stage} onOn={soundOn} onOff={soundOff} />
    </>
  );
}
