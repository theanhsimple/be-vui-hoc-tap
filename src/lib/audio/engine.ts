import {
  type AudioSource,
  type AudioState,
  type PlayOutcome,
  type SfxKind,
  sourceKey,
} from "./types";
import { pickVoice } from "./voice";

/** Browser capabilities the engine needs. Injected so it can be unit-tested. */
export interface AudioDeps {
  createContext: () => AudioContext | null;
  fetchAudio: (src: string) => Promise<ArrayBuffer>;
  speech: SpeechSynthesis | null;
  createUtterance: (text: string) => SpeechSynthesisUtterance;
}

interface Playback {
  stop: () => void;
}

/** Voice is ducked to this level when a sound effect plays over it, and vice versa. */
const SFX_GAIN = 0.7;
const SFX_GAIN_UNDER_VOICE = 0.25;

/** Note sequences for synthesized sound effects: [frequency Hz, duration s]. */
const SFX: Record<
  SfxKind,
  { wave: OscillatorType; notes: [number, number][] }
> = {
  tap: { wave: "sine", notes: [[660, 0.06]] },
  correct: {
    wave: "triangle",
    notes: [
      [523, 0.09],
      [659, 0.09],
      [784, 0.16],
    ],
  },
  // Gentle descending pair — deliberately not a buzzer (UX spec §1.3).
  tryAgain: {
    wave: "sine",
    notes: [
      [494, 0.12],
      [440, 0.18],
    ],
  },
  reward: {
    wave: "triangle",
    notes: [
      [523, 0.08],
      [659, 0.08],
      [784, 0.08],
      [1047, 0.24],
    ],
  },
};

/**
 * Audio for little's audio-first kid experience.
 *
 * - `unlock()` must run inside a user gesture (first tap); before that, iOS
 *   Safari blocks all sound and `play()` returns "locked".
 * - `preload()` fetches files early so prompts start without delay.
 * - `play()` plays one prompt at a time; a new prompt interrupts the previous.
 * - Recorded files are primary, speech synthesis is the fallback.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private raw = new Map<string, Promise<ArrayBuffer>>();
  private decoded = new Map<string, Promise<AudioBuffer>>();
  private current: Playback | null = null;
  private generation = 0;
  private listeners = new Set<() => void>();
  private state: AudioState = {
    unlocked: false,
    voiceEnabled: true,
    sfxEnabled: true,
    playingKey: null,
  };

  constructor(private readonly deps: AudioDeps) {}

  getState(): AudioState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  /** Call synchronously from a user-gesture handler. Safe to call repeatedly. */
  unlock(): void {
    if (this.state.unlocked) return;
    if (!this.ctx) {
      this.ctx = this.deps.createContext();
      if (this.ctx) {
        this.voiceGain = this.ctx.createGain();
        this.voiceGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = SFX_GAIN;
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx) {
      void this.ctx.resume();
      // Playing a silent frame inside the gesture is what unlocks iOS WebAudio.
      const silent = this.ctx.createBufferSource();
      silent.buffer = this.ctx.createBuffer(1, 1, 22050);
      silent.connect(this.ctx.destination);
      silent.start(0);
    }
    // iOS also requires the first speech synthesis call to happen in a gesture.
    if (this.deps.speech) {
      const warmup = this.deps.createUtterance("");
      warmup.volume = 0;
      this.deps.speech.speak(warmup);
    }
    this.setState({ unlocked: true });
  }

  setVoiceEnabled(enabled: boolean): void {
    if (!enabled) this.stop();
    this.setState({ voiceEnabled: enabled });
  }

  setSfxEnabled(enabled: boolean): void {
    this.setState({ sfxEnabled: enabled });
  }

  /** Starts downloading files so later play() calls start quickly. Never throws. */
  preload(srcs: readonly string[]): void {
    for (const src of srcs) {
      void this.loadRaw(src).catch(() => undefined);
    }
  }

  private loadRaw(src: string): Promise<ArrayBuffer> {
    let p = this.raw.get(src);
    if (!p) {
      p = this.deps.fetchAudio(src);
      this.raw.set(src, p);
      // A failed download may succeed later (e.g. network came back).
      p.catch(() => this.raw.delete(src));
    }
    return p;
  }

  private loadDecoded(ctx: AudioContext, src: string): Promise<AudioBuffer> {
    let p = this.decoded.get(src);
    if (!p) {
      // decodeAudioData detaches its input, so decode a copy of the cached bytes.
      p = this.loadRaw(src).then((bytes) =>
        ctx.decodeAudioData(bytes.slice(0)),
      );
      this.decoded.set(src, p);
      p.catch(() => this.decoded.delete(src));
    }
    return p;
  }

  /** Stops whatever prompt is playing. */
  stop(): void {
    this.generation++;
    this.current?.stop();
    this.current = null;
    if (this.state.playingKey !== null) this.setState({ playingKey: null });
  }

  async play(source: AudioSource): Promise<PlayOutcome> {
    this.stop();
    const gen = this.generation;
    if (!this.state.voiceEnabled) return "muted";
    if (!this.state.unlocked) return "locked";

    const key = sourceKey(source);
    const ctx = this.ctx;
    if (source.src && ctx) {
      try {
        const buffer = await this.loadDecoded(ctx, source.src);
        if (gen !== this.generation) return "interrupted";
        this.setState({ playingKey: key });
        const finished = await this.playBuffer(ctx, buffer);
        return this.finish(gen, finished ? "played" : "interrupted");
      } catch {
        if (gen !== this.generation) return "interrupted";
        // fall through to speech synthesis
      }
    }

    if (source.text) {
      const spoken = await this.speak(
        source.text,
        source.lang ?? "vi-VN",
        key,
        gen,
      );
      if (spoken !== null)
        return this.finish(gen, spoken ? "tts" : "interrupted");
    }
    return "unavailable";
  }

  private finish(gen: number, outcome: PlayOutcome): PlayOutcome {
    if (gen === this.generation) {
      this.current = null;
      this.setState({ playingKey: null });
    }
    return outcome;
  }

  private playBuffer(ctx: AudioContext, buffer: AudioBuffer): Promise<boolean> {
    return new Promise((resolve) => {
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(this.voiceGain ?? ctx.destination);
      node.onended = () => resolve(true);
      this.current = {
        stop: () => {
          node.onended = null;
          try {
            node.stop();
          } catch {
            // already stopped
          }
          resolve(false);
        },
      };
      node.start(0);
    });
  }

  /** Resolves true when finished, false when interrupted, null when no voice exists. */
  private async speak(
    text: string,
    lang: string,
    key: string,
    gen: number,
  ): Promise<boolean | null> {
    const speech = this.deps.speech;
    if (!speech) return null;
    const voice = pickVoice(await voicesSoon(speech), lang);
    if (!voice) return null;
    if (gen !== this.generation) return false;

    return new Promise((resolve) => {
      const u = this.deps.createUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.95;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(gen === this.generation);
      this.current = {
        stop: () => {
          u.onend = null;
          u.onerror = null;
          speech.cancel();
          resolve(false);
        },
      };
      this.setState({ playingKey: key });
      speech.cancel();
      speech.speak(u);
    });
  }

  /** Short synthesized sound effect; does not interrupt the voice prompt. */
  playSfx(kind: SfxKind): void {
    const ctx = this.ctx;
    const out = this.sfxGain;
    if (!ctx || !out || !this.state.unlocked || !this.state.sfxEnabled) return;
    out.gain.value = this.state.playingKey ? SFX_GAIN_UNDER_VOICE : SFX_GAIN;

    const { wave, notes } = SFX[kind];
    let t = ctx.currentTime + 0.01;
    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.5, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(env);
      env.connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  }
}

/** Chrome loads voices asynchronously; wait briefly for them on first use. */
function voicesSoon(
  speech: SpeechSynthesis,
  timeoutMs = 600,
): Promise<SpeechSynthesisVoice[]> {
  const now = speech.getVoices();
  if (now.length > 0 || typeof speech.addEventListener !== "function") {
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      speech.removeEventListener("voiceschanged", done);
      resolve(speech.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    speech.addEventListener("voiceschanged", done);
  });
}

export function createBrowserAudioEngine(): AudioEngine {
  return new AudioEngine({
    createContext: () => {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      return Ctor ? new Ctor() : null;
    },
    fetchAudio: async (src) => {
      const res = await fetch(src);
      if (!res.ok)
        throw new Error(`Audio request failed: ${res.status} ${src}`);
      return res.arrayBuffer();
    },
    speech: "speechSynthesis" in window ? window.speechSynthesis : null,
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
  });
}
