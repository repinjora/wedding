import { Words } from "./ui";

type Props = {
  leaving: boolean;
  ready: boolean;
  onEnter: () => void;
};

/** СЦЕНА 1 — кинематографичное вступление */
export default function Intro({ leaving, ready, onEnter }: Props) {
  return (
    <section className={`intro ${leaving ? "leaving" : ""}`} aria-label="Вступление">
      <div className="intro-inner go">
        <h1 className="intro-title">
          <Words text="Однажды зимой" delay={5} step={0.16} />
          <br />
          <Words text="началась наша история…" delay={6.1} step={0.16} />
        </h1>

        <div className={`intro-line ${ready ? "show" : ""}`} />

        <button
          type="button"
          className={`enter-btn ${ready ? "show" : ""}`}
          onClick={onEnter}
          disabled={!ready || leaving}
          tabIndex={ready ? 0 : -1}
        >
          <span>ВОЙТИ В НАШУ ИСТОРИЮ</span>
        </button>
      </div>
    </section>
  );
}
