import { beforeEach, describe, expect, it, vi } from "vitest";

import { type AudioDeps, AudioEngine } from "./engine";

/** Minimal fakes for the Web Audio / Speech APIs the engine touches. */
function fakeParam() {
  return {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class FakeSourceNode {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  connect = vi.fn();
  start = vi.fn(() => {
    this.started = true;
  });
  stop = vi.fn(() => {
    this.stopped = true;
  });
  /** Simulate natural end of playback. */
  end() {
    this.onended?.();
  }
}

class FakeContext {
  state = "suspended";
  currentTime = 0;
  destination = {};
  sources: FakeSourceNode[] = [];
  oscillators = 0;
  resume = vi.fn(async () => {
    this.state = "running";
  });
  createGain = vi.fn(() => ({ gain: fakeParam(), connect: vi.fn() }));
  createBuffer = vi.fn(() => ({}));
  createBufferSource = vi.fn(() => {
    const s = new FakeSourceNode();
    this.sources.push(s);
    return s;
  });
  createOscillator = vi.fn(() => {
    this.oscillators++;
    return {
      type: "sine",
      frequency: fakeParam(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  });
  decodeAudioData = vi.fn(async (bytes: ArrayBuffer) => ({
    decodedFrom: bytes.byteLength,
  }));
}

class FakeUtterance {
  voice: unknown = null;
  lang = "";
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function setup(
  opts: {
    voices?: { lang: string; name: string }[];
    fetchFails?: boolean;
  } = {},
) {
  const ctx = new FakeContext();
  const spoken: FakeUtterance[] = [];
  const speech = {
    getVoices: vi.fn(() => opts.voices ?? []),
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
  };
  const fetchAudio = vi.fn(async (src: string) => {
    if (opts.fetchFails) throw new Error(`404 ${src}`);
    return new ArrayBuffer(8);
  });
  const deps = {
    createContext: () => ctx,
    fetchAudio,
    speech,
    createUtterance: (text: string) => new FakeUtterance(text),
  } as unknown as AudioDeps;
  const engine = new AudioEngine(deps);
  return { engine, ctx, speech, spoken, fetchAudio };
}

/** Lets pending promise callbacks run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("AudioEngine", () => {
  beforeEach(() => vi.useRealTimers());

  it("refuses to play before a user gesture unlocks audio", async () => {
    const { engine } = setup();
    await expect(engine.play({ src: "/a.mp3" })).resolves.toBe("locked");
  });

  it("unlock resumes the context, plays a silent frame, and warms up speech", () => {
    const { engine, ctx, spoken } = setup();
    engine.unlock();
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.sources[0]?.started).toBe(true);
    expect(spoken[0]?.text).toBe("");
    expect(engine.getState().unlocked).toBe(true);
  });

  it("plays a recorded file and reports 'played' when it ends", async () => {
    const { engine, ctx } = setup();
    engine.unlock();
    const result = engine.play({ src: "/a.mp3" });
    await flush();
    const node = ctx.sources.at(-1)!;
    expect(node.started).toBe(true);
    expect(engine.getState().playingKey).toBe("/a.mp3");
    node.end();
    await expect(result).resolves.toBe("played");
    expect(engine.getState().playingKey).toBeNull();
  });

  it("preload fetches once and reuses the bytes", async () => {
    const { engine, fetchAudio } = setup();
    engine.preload(["/a.mp3", "/a.mp3"]);
    engine.unlock();
    const p = engine.play({ src: "/a.mp3" });
    await flush();
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    engine.stop();
    await expect(p).resolves.toBe("interrupted");
  });

  it("a new prompt interrupts the previous one", async () => {
    const { engine, ctx } = setup();
    engine.unlock();
    const first = engine.play({ src: "/a.mp3" });
    await flush();
    const firstNode = ctx.sources.at(-1)!;
    const second = engine.play({ src: "/b.mp3" });
    await expect(first).resolves.toBe("interrupted");
    expect(firstNode.stopped).toBe(true);
    await flush();
    ctx.sources.at(-1)!.end();
    await expect(second).resolves.toBe("played");
  });

  it("falls back to speech synthesis when the file fails", async () => {
    const { engine, spoken } = setup({
      fetchFails: true,
      voices: [{ lang: "vi-VN", name: "Linh" }],
    });
    engine.unlock();
    const p = engine.play({
      src: "/missing.mp3",
      text: "Xin chào",
      lang: "vi-VN",
    });
    await flush();
    await flush();
    const u = spoken.at(-1)!;
    expect(u.text).toBe("Xin chào");
    expect(u.lang).toBe("vi-VN");
    u.onend?.();
    await expect(p).resolves.toBe("tts");
  });

  it("reports 'unavailable' when there is no file and no matching voice", async () => {
    const { engine } = setup({ voices: [{ lang: "en-US", name: "Samantha" }] });
    engine.unlock();
    await expect(
      engine.play({ text: "Xin chào", lang: "vi-VN" }),
    ).resolves.toBe("unavailable");
  });

  it("returns 'muted' when voice is turned off", async () => {
    const { engine } = setup();
    engine.unlock();
    engine.setVoiceEnabled(false);
    await expect(engine.play({ src: "/a.mp3" })).resolves.toBe("muted");
  });

  it("plays synthesized SFX only when unlocked and enabled", () => {
    const { engine, ctx } = setup();
    engine.playSfx("correct");
    expect(ctx.oscillators).toBe(0);
    engine.unlock();
    engine.playSfx("correct");
    expect(ctx.oscillators).toBe(3);
    engine.setSfxEnabled(false);
    engine.playSfx("tap");
    expect(ctx.oscillators).toBe(3);
  });

  it("notifies subscribers on state changes", () => {
    const { engine } = setup();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    engine.unlock();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    engine.setSfxEnabled(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
