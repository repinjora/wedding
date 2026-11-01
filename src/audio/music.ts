/**
 * Оригинальный генеративный саундтрек (Web Audio API) — никаких сторонних сэмплов,
 * поэтому нет вопросов с авторскими правами.
 *
 * Тональность: си минор / ре мажор. Прогрессия Bm – G – D – A (по 2 такта), 66 BPM.
 * Нежное «пианино» (арпеджио + мелодия), струнные пады, мерцающие колокольчики,
 * очень тихий ветер. Музыка постепенно нарастает в течение ~70 секунд.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const BPM = 66;
const BEAT = 60 / BPM;
const CHORD_BEATS = 8;

type Chord = {
  bass: number;
  pad: number[];
  arp: number[];
  melody: [number, number, number][]; // [beatOffset, midi, durBeats]
};

const CHORDS: Chord[] = [
  {
    bass: 47,
    pad: [59, 62, 66, 71, 74],
    arp: [59, 62, 66, 71, 74, 78],
    melody: [[0, 78, 2], [2, 76, 1], [3, 74, 1], [4, 71, 3], [7, 74, 1]],
  },
  {
    bass: 43,
    pad: [55, 59, 62, 67, 71],
    arp: [55, 59, 62, 67, 71, 74],
    melody: [[0, 74, 2], [2, 71, 1], [3, 74, 1], [4, 79, 3], [7, 78, 1]],
  },
  {
    bass: 50,
    pad: [57, 62, 66, 69, 74],
    arp: [57, 62, 66, 69, 74, 78],
    melody: [[0, 78, 2], [2, 81, 2], [4, 78, 2], [6, 76, 1], [7, 74, 1]],
  },
  {
    bass: 45,
    pad: [57, 61, 64, 69, 73],
    arp: [57, 61, 64, 69, 73, 76],
    melody: [[0, 76, 2], [2, 73, 2], [4, 76, 2], [6, 81, 1], [7, 76, 1]],
  },
];

const ARP_PATTERN = [0, 2, 3, 4, 3, 2, 4, 5, 3, 2, 3, 4, 5, 4, 3, 2];

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private timer: number | undefined;
  private nextChordTime = 0;
  private chordIndex = 0;
  private startTime = 0;
  private suspendTimer: number | undefined;
  playing = false;

  private build() {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);

    // Реверберация из сгенерированного импульса
    const conv = ctx.createConvolver();
    conv.buffer = this.impulse(3.8, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.bus.connect(conv).connect(wet).connect(this.master);

    // Тихий ветер
    const len = ctx.sampleRate * 4;
    const nb = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = nb.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
    }
    const noise = ctx.createBufferSource();
    noise.buffer = nb;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.6;
    const wind = ctx.createGain();
    wind.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(wind.gain);
    noise.connect(bp).connect(wind).connect(this.master);
    noise.start();
    lfo.start();
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  async start() {
    try {
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = "playback"; // iOS: играть даже при беззвучном режиме
    } catch {
      /* ignore */
    }
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    window.clearTimeout(this.suspendTimer);
    if (ctx.state !== "running") await ctx.resume();
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.4);
    this.playing = true;

    if (this.timer === undefined) {
      this.startTime = ctx.currentTime + 0.25;
      this.nextChordTime = this.startTime;
      this.chordIndex = 0;
      this.pump();
      this.timer = window.setInterval(() => this.pump(), 1000);
      document.addEventListener("visibilitychange", this.onVisibility);
    }
  }

  pause() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.playing = false;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      if (!this.playing) void ctx.suspend();
    }, 1600);
  }

  private onVisibility = () => {
    if (document.visibilityState === "visible" && this.playing && this.ctx && this.ctx.state !== "running") {
      void this.ctx.resume();
    }
  };

  private pump() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextChordTime < ctx.currentTime + 10) {
      this.scheduleChord(this.chordIndex, this.nextChordTime);
      this.chordIndex++;
      this.nextChordTime += CHORD_BEATS * BEAT;
    }
  }

  private scheduleChord(i: number, T: number) {
    const chord = CHORDS[i % CHORDS.length];
    const energy = Math.min(1, (T - this.startTime) / 70);
    const len = CHORD_BEATS * BEAT;

    // Струнные
    this.strings(T, chord.pad, len + 2.2, 0.3 + 0.7 * energy);

    // Бас
    this.piano(T, chord.bass, 0.5, len * 0.95);
    this.piano(T + 0.01, chord.bass + 12, 0.28, len * 0.8);

    // Арпеджио
    for (let s = 0; s < 16; s++) {
      if (i < 2 && s % 2 !== 0) continue;
      const note = chord.arp[ARP_PATTERN[s]];
      const accent = s % 4 === 0 ? 0.08 : 0;
      const vel = 0.16 + 0.14 * energy + accent + (Math.random() - 0.5) * 0.04;
      const t = T + s * (BEAT / 2) + (Math.random() - 0.5) * 0.012;
      this.piano(t, note, vel, 2.4);
    }

    // Мелодия
    if (i >= 2) {
      const v = i >= 4 ? 0.4 : 0.3;
      for (const [off, midi, d] of chord.melody) {
        this.piano(T + off * BEAT + (Math.random() - 0.5) * 0.015, midi, v, d * BEAT * 1.5 + 0.8);
      }
    }

    // Колокольчики
    if (i >= 3) {
      for (let k = 0; k < 2; k++) {
        if (Math.random() < 0.7) {
          const m = chord.arp[Math.floor(Math.random() * chord.arp.length)] + 24;
          this.bell(T + Math.random() * len, m, 0.025 + 0.02 * energy);
        }
      }
    }
  }

  private piano(t: number, midi: number, vel: number, dur: number) {
    const ctx = this.ctx!;
    const f = mtof(midi);
    const decay = Math.max(1.2, dur) * (midi < 55 ? 1.3 : 1);

    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.min(8000, 1100 + vel * 5200 + f * 1.5);
    out.connect(lp).connect(this.bus);

    const gA = ctx.createGain();
    gA.gain.setValueAtTime(0.0001, t);
    gA.gain.linearRampToValueAtTime(vel * 0.5, t + 0.008);
    gA.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    gA.connect(out);

    const gB = ctx.createGain();
    gB.gain.setValueAtTime(0.0001, t);
    gB.gain.linearRampToValueAtTime(vel * 0.5, t + 0.006);
    gB.gain.exponentialRampToValueAtTime(0.0005, t + decay * 0.35);
    gB.connect(out);

    const osc = (freq: number, type: OscillatorType, level: number, dest: AudioNode, end: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + end + 0.1);
    };

    osc(f, "sine", 1, gA, decay);
    osc(f * 1.0016, "sine", 0.5, gA, decay);
    osc(f * 2, "sine", 0.34, gB, decay * 0.35);
    osc(f * 3, "sine", 0.14, gB, decay * 0.35);
    osc(f * 4, "sine", 0.06, gB, decay * 0.35);
  }

  private strings(t: number, notes: number[], dur: number, level: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level * 0.05, t + 2.8);
    g.gain.setValueAtTime(level * 0.05, t + dur - 3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.linearRampToValueAtTime(900 + 1100 * level, t + 4);
    g.connect(lp).connect(this.bus);
    for (const m of notes) {
      for (const det of [-9, 8]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = mtof(m);
        o.detune.value = det;
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.1);
      }
    }
  }

  private bell(t: number, midi: number, level: number) {
    const ctx = this.ctx!;
    const f = mtof(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0003, t + 3.2);
    g.connect(this.bus);
    for (const [mul, lv] of [[1, 1], [2.76, 0.3]] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * mul;
      const og = ctx.createGain();
      og.gain.value = lv;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 3.4);
    }
  }
}
