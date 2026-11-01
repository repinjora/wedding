const MUSIC_URL = `${import.meta.env.BASE_URL}audio/a-thousand-years.mp3`;

/** Music starts only after a visitor taps the sound button. */
export class MusicEngine {
  private readonly audio: HTMLAudioElement;
  playing = false;

  constructor() {
    this.audio = new Audio(MUSIC_URL);
    this.audio.preload = "none";
    this.audio.loop = true;
    this.audio.volume = 0.72;
  }

  async start() {
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = "playback";
    } catch {
      // audioSession is not available in every browser.
    }

    await this.audio.play();
    this.playing = true;
  }

  pause() {
    this.audio.pause();
    this.playing = false;
  }
}
