import { Reveal, Words } from "./ui";

/** СЦЕНА 3 — приглашение */
export default function Invitation() {
  return (
    <section id="invitation" className="section invitation">
      <Reveal className="ornament">
        <span />
      </Reveal>

      <Reveal as="div" className="inv-text">
        <Words
          as="p"
          className="inv-p"
          text="Первый день нашей свадьбы мы проведём в кругу семьи, а этот вечер хотим посвятить друзьям, близким и тем, с кем хочется разделить самые счастливые моменты."
          delay={0.1}
          step={0.045}
        />
      </Reveal>

      <Reveal as="div" className="inv-text">
        <Words
          as="p"
          className="inv-p"
          text="Давайте соберёмся вместе, чтобы провести незабываемый вечер, наполненный смехом, музыкой и хорошими воспоминаниями."
          delay={0.1}
          step={0.05}
        />
      </Reveal>

      <Reveal as="div" className="inv-text">
        <Words as="p" className="inv-p inv-final" text="Будем очень ждать встречи!" delay={0.2} step={0.16} />
      </Reveal>
    </section>
  );
}
