"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";

import { AudioEngine, createBrowserAudioEngine } from "./engine";
import type { AudioSource, AudioState, PlayOutcome, SfxKind } from "./types";

let engine: AudioEngine | null = null;

/** The single browser audio engine (null during server rendering). */
export function getAudioEngine(): AudioEngine | null {
  if (typeof window === "undefined") return null;
  engine ??= createBrowserAudioEngine();
  return engine;
}

/** Test hook: replace the engine used by the React bindings. */
export function setAudioEngineForTesting(next: AudioEngine | null): void {
  engine = next;
}

const SERVER_STATE: AudioState = {
  unlocked: false,
  voiceEnabled: true,
  sfxEnabled: true,
  playingKey: null,
};

const subscribe = (listener: () => void) =>
  getAudioEngine()?.subscribe(listener) ?? (() => {});
const getSnapshot = () => getAudioEngine()?.getState() ?? SERVER_STATE;
const getServerSnapshot = () => SERVER_STATE;

/**
 * Activation-triggering events per the HTML spec. `pointerdown` from touch
 * does not count, so a first tap is caught on `pointerup` / `touchend`.
 */
const UNLOCK_EVENTS = ["pointerup", "touchend", "click", "keydown"] as const;

/**
 * Unlocks audio on the first user gesture anywhere on the page.
 * Mount once near the root.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const audio = getAudioEngine();
    if (!audio || audio.getState().unlocked) return;
    const onGesture = () => {
      audio.unlock();
      remove();
    };
    const remove = () => {
      for (const e of UNLOCK_EVENTS)
        document.removeEventListener(e, onGesture, true);
    };
    for (const e of UNLOCK_EVENTS)
      document.addEventListener(e, onGesture, true);
    return remove;
  }, []);

  return <>{children}</>;
}

export interface UseAudio extends AudioState {
  play: (source: AudioSource) => Promise<PlayOutcome>;
  stop: () => void;
  preload: (srcs: readonly string[]) => void;
  playSfx: (kind: SfxKind) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
}

export function useAudio(): UseAudio {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const play = useCallback(
    (source: AudioSource) =>
      getAudioEngine()?.play(source) ?? Promise.resolve("unavailable" as const),
    [],
  );
  const stop = useCallback(() => getAudioEngine()?.stop(), []);
  const preload = useCallback(
    (srcs: readonly string[]) => getAudioEngine()?.preload(srcs),
    [],
  );
  const playSfx = useCallback(
    (kind: SfxKind) => getAudioEngine()?.playSfx(kind),
    [],
  );
  const setVoiceEnabled = useCallback(
    (v: boolean) => getAudioEngine()?.setVoiceEnabled(v),
    [],
  );
  const setSfxEnabled = useCallback(
    (v: boolean) => getAudioEngine()?.setSfxEnabled(v),
    [],
  );

  return {
    ...state,
    play,
    stop,
    preload,
    playSfx,
    setVoiceEnabled,
    setSfxEnabled,
  };
}
