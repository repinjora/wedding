type Sound = "unset" | "on" | "off";

type Props = {
  sound: Sound;
  stage: "intro" | "leaving" | "story";
  onOn: () => void;
  onOff: () => void;
};

export default function SoundControl({ sound, stage, onOn, onOff }: Props) {
  const showPrompt = sound === "unset" && stage === "intro";

  return (
    <>
      {showPrompt && (
        <div className="sound-prompt" role="dialog" aria-label="Музыка">
          <button type="button" className="sp-main" onClick={onOn}>
            <span className="sp-note" aria-hidden="true">♪</span>
            Включить музыку
          </button>
          <button type="button" className="sp-ghost" onClick={onOff}>
            без звука
          </button>
        </div>
      )}

      <button
        type="button"
        className={`sound-btn ${sound}`}
        onClick={sound === "on" ? onOff : onOn}
        aria-label={sound === "on" ? "Выключить музыку" : "Включить музыку"}
        aria-pressed={sound === "on"}
      >
        <span className="ring r1" />
        <span className="ring r2" />
        {sound === "on" ? (
          <span className="eq" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18V6l10-2v12" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="16.5" cy="16" r="2.5" />
            {sound === "off" && <path d="M3 3l18 18" />}
          </svg>
        )}
      </button>
    </>
  );
}
