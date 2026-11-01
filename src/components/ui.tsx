import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/** Плавное появление блока при прокрутке (размытие + подъём) */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ "--rd": `${delay}s` } as CSSVars}
    >
      {children}
    </Tag>
  );
}

/** Текст, появляющийся по словам. Анимируется внутри `.in` (Reveal) или `.go`. */
export function Words({
  text,
  className = "",
  delay = 0,
  step = 0.12,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  as?: ElementType;
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span
            className="w"
            aria-hidden="true"
            style={{ "--i": i, "--d": `${delay}s`, "--s": `${step}s` } as CSSVars}
          >
            {w}
          </span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Крупный заголовок по буквам */
export function Letters({
  text,
  className = "",
  delay = 0,
  step = 0.09,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((c, i) => (
        <span
          key={i}
          className="ch"
          aria-hidden="true"
          style={{ "--i": i, "--d": `${delay}s`, "--s": `${step}s` } as CSSVars}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}

export type { CSSVars };
