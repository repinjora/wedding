import { useEffect, useRef } from "react";
import { forestUrl } from "../assets";

type Props = { push: boolean };

function makeSprite(size: number, stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Весь «живой» фон: лес с параллаксом и глубиной, огоньки, туман, снег.
 * Один requestAnimationFrame на два canvas, спрайты предрисованы — работает плавно на телефонах.
 */
export default function Atmosphere({ push }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const snowRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const sc = snowRef.current!;
    const lc = lightRef.current!;
    const sctx = sc.getContext("2d")!;
    const lctx = lc.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 768;

    let W = 0;
    let H = 0;
    let sdpr = 1;
    const resize = (force = false) => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      if (!force && nw === W && Math.abs(nh - H) < 140) return;
      W = nw;
      H = nh;
      sdpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2);
      sc.width = Math.round(W * sdpr);
      sc.height = Math.round(H * sdpr);
      lc.width = W;
      lc.height = H;
    };
    resize(true);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const snowSprite = makeSprite(64, [
      [0, "rgba(255,255,255,1)"],
      [0.25, "rgba(240,246,255,.85)"],
      [0.6, "rgba(210,225,255,.16)"],
      [1, "rgba(200,220,255,0)"],
    ]);
    const bokehSprite = makeSprite(64, [
      [0, "rgba(235,242,255,.30)"],
      [0.72, "rgba(220,232,255,.26)"],
      [0.92, "rgba(225,236,255,.42)"],
      [1, "rgba(220,232,255,0)"],
    ]);
    const lightSprite = makeSprite(96, [
      [0, "rgba(255,246,220,1)"],
      [0.1, "rgba(255,216,148,.95)"],
      [0.32, "rgba(255,182,92,.33)"],
      [1, "rgba(255,160,60,0)"],
    ]);

    // Снежинки: слои глубины
    const N = reduce ? 40 : mobile ? 120 : 210;
    const flakes = Array.from({ length: N }, () => {
      const z = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z,
        r: 0.9 + z * z * 3.0 + (z > 0.92 ? 4.5 : 0),
        vy: 16 + z * 58 + Math.random() * 10,
        ph: Math.random() * 6.28,
        sw: 8 + Math.random() * 22,
        sf: 0.3 + Math.random() * 0.7,
        a: 0.3 + z * 0.55,
      };
    });

    // Огоньки среди деревьев
    const LN = mobile ? 55 : 90;
    const lights = Array.from({ length: LN }, (_, i) => {
      const d = Math.random();
      return {
        x: Math.random(),
        y: 0.2 + Math.pow(Math.random(), 0.85) * 0.7,
        d,
        s: 5 + d * d * 24,
        f: 0.6 + Math.random() * 1.6,
        ph: Math.random() * 6.28,
        at: 4.5 + i * (reduce ? 0.02 : 0.11) + Math.random() * 1.2,
        base: 0.32 + d * 0.5,
        dr: Math.random() * 6.28,
      };
    });

    // Параллакс-ввод
    let tpx = 0;
    let tpy = 0;
    let px = 0;
    let py = 0;
    let sy = window.scrollY;
    let hasInput = false;
    const onPointer = (e: PointerEvent) => {
      hasInput = true;
      tpx = (e.clientX / W - 0.5) * 2;
      tpy = (e.clientY / H - 0.5) * 2;
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      hasInput = true;
      tpx = clamp(e.gamma / 25, -1, 1);
      tpy = clamp((e.beta - 55) / 25, -1, 1);
    };
    const onScroll = () => {
      sy = window.scrollY;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onOrient, true);
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let lastPx = 99;
    let lastPy = 99;
    let lastSy = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      // параллакс
      const auto = hasInput ? 0 : Math.sin(t * 0.09) * 0.45;
      px += ((tpx + auto) - px) * Math.min(1, dt * 2.2);
      py += ((tpy + (hasInput ? 0 : Math.cos(t * 0.07) * 0.25)) - py) * Math.min(1, dt * 2.2);
      if (Math.abs(px - lastPx) > 0.002 || Math.abs(py - lastPy) > 0.002 || sy !== lastSy) {
        lastPx = px;
        lastPy = py;
        lastSy = sy;
        const dim = clamp((sy - H * 0.35) / (H * 0.8), 0, 1) * 0.6;
        root.style.setProperty("--px", px.toFixed(3));
        root.style.setProperty("--py", py.toFixed(3));
        root.style.setProperty("--sy", sy.toFixed(1));
        root.style.setProperty("--dim", dim.toFixed(3));
      }

      // огоньки
      lctx.clearRect(0, 0, W, H);
      lctx.globalCompositeOperation = "lighter";
      for (const l of lights) {
        const k = clamp((t - l.at) / 2.4, 0, 1);
        if (k <= 0) continue;
        const tw = 0.62 + 0.38 * Math.sin(t * l.f + l.ph);
        const x = l.x * W - px * (8 + l.d * 30) + Math.sin(t * 0.18 + l.dr) * (2 + l.d * 5);
        const y = l.y * H - py * (4 + l.d * 16) - sy * (0.08 + l.d * 0.12) + Math.cos(t * 0.23 + l.dr) * (3 + l.d * 6);
        if (y < -40 || y > H + 40) continue;
        lctx.globalAlpha = k * tw * l.base;
        lctx.drawImage(lightSprite, x - l.s, y - l.s, l.s * 2, l.s * 2);
      }
      lctx.globalAlpha = 1;
      lctx.globalCompositeOperation = "source-over";

      // снег
      sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
      sctx.clearRect(0, 0, W, H);
      const snowK = clamp((t - 0.6) / 5, 0, 1);
      const wind = Math.sin(t * 0.11) * 14 + px * 12;
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x += wind * (0.25 + f.z) * dt;
        if (f.y > H + 20) {
          f.y = -20;
          f.x = Math.random() * W;
        }
        if (f.x > W + 30) f.x = -30;
        else if (f.x < -30) f.x = W + 30;
        const x = f.x + Math.sin(t * f.sf + f.ph) * f.sw * (0.3 + f.z);
        const bokeh = f.z > 0.92;
        const d = f.r * (bokeh ? 6 : 5);
        sctx.globalAlpha = f.a * snowK * (bokeh ? 0.75 : 1);
        sctx.drawImage(bokeh ? bokehSprite : snowSprite, x - d / 2, f.y - d / 2, d, d);
      }
      sctx.globalAlpha = 1;
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      {/* Задний план: лес, огоньки, туман — под контентом */}
      <div ref={rootRef} className={`atmo ${push ? "push" : ""}`} aria-hidden="true">
        <div className="zoomer">
          <div className="bg-reveal">
            <div className="l-bg">
              <img src={forestUrl} alt="" decoding="async" />
            </div>
            <div className="l-depth">
              <img src={forestUrl} alt="" decoding="async" />
            </div>
            <div className="rays" />
          </div>
          <canvas ref={lightRef} className="cv" />
        </div>
        <div className="fog-wrap">
          <div className="fog f1" />
          <div className="fog f2" />
          <div className="fog f3" />
        </div>
        <div className="dim" />
        <div className="flash" />
      </div>

      {/* Передний план: снег, виньетка, зерно — поверх контента */}
      <div className="atmo-front" aria-hidden="true">
        <canvas ref={snowRef} className="cv" />
        <div className="vignette" />
        <div className="grain" />
      </div>
    </>
  );
}
