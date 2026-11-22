export type AudioLang = "vi-VN" | "en-US";

/**
 * Something the child should hear. A recorded file (`src`) is the primary
 * voice; `text` is spoken with the browser's speech synthesis only when the
 * file is missing or fails (docs/DECISIONS.md D-006). At least one is required.
 */
export type AudioSource =
  | { src: string; text?: string; lang?: AudioLang }
  | { src?: undefined; text: string; lang?: AudioLang };

export type PlayOutcome =
  /** The recorded file played to the end. */
  | "played"
  /** Speech synthesis fallback was used. */
  | "tts"
  /** Audio has not been unlocked by a user gesture yet (iOS/Safari autoplay rules). */
  | "locked"
  /** Voice is turned off in settings. */
  | "muted"
  /** Another play() or stop() cut this one short. */
  | "interrupted"
  /** Nothing could be played: file failed and no usable voice for `text`. */
  | "unavailable";

export type SfxKind = "tap" | "correct" | "tryAgain" | "reward";

export interface AudioState {
  unlocked: boolean;
  voiceEnabled: boolean;
  sfxEnabled: boolean;
  /** Key of the source currently playing (see `sourceKey`), or null. */
  playingKey: string | null;
  /** Key of the source whose file is downloading/decoding, or null. */
  loadingKey: string | null;
}

export function sourceKey(source: AudioSource): string {
  return source.src ?? `tts:${source.lang ?? "vi-VN"}:${source.text}`;
}
