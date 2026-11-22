export interface VoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
}

const normalise = (lang: string) => lang.replace("_", "-").toLowerCase();

/**
 * Picks the best speech-synthesis voice for a language tag such as "vi-VN".
 * Exact tag match wins, then same base language; local voices are preferred
 * because they start faster and work offline. Returns null when none exists —
 * many devices ship without a Vietnamese voice, and callers must handle that.
 */
export function pickVoice<V extends VoiceLike>(
  voices: readonly V[],
  lang: string,
): V | null {
  const wanted = normalise(lang);
  const base = wanted.split("-")[0];
  const rank = (v: V) => {
    const l = normalise(v.lang);
    const langScore = l === wanted ? 2 : l.split("-")[0] === base ? 1 : 0;
    return langScore === 0 ? -1 : langScore * 2 + (v.localService ? 1 : 0);
  };
  let best: V | null = null;
  let bestRank = -1;
  for (const v of voices) {
    const r = rank(v);
    if (r > bestRank) {
      best = v;
      bestRank = r;
    }
  }
  return best;
}
