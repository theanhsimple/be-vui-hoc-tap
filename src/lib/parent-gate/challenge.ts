/**
 * Parent gate: an adult-only check before leaving kid mode (PRD S9).
 *
 * The instruction is written in Vietnamese words ("bảy mươi hai") and never
 * read aloud, so a 5–6-year-old who recognises digits but cannot read yet
 * can't match it. Every attempt requires a long hold, so random tapping is slow.
 */

export const HOLD_MS = 1500;
export const OPTION_COUNT = 6;

const UNITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
] as const;

/** Vietnamese words for 10–99, e.g. 21 → "hai mươi mốt", 15 → "mười lăm". */
export function vietnameseNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 10 || n > 99) {
    throw new RangeError(`Expected an integer from 10 to 99, got ${n}`);
  }
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  const head = tens === 1 ? "mười" : `${UNITS[tens]} mươi`;
  if (unit === 0) return head;
  if (unit === 5) return `${head} lăm`;
  if (unit === 1 && tens > 1) return `${head} mốt`;
  return `${head} ${UNITS[unit]}`;
}

export interface GateChallenge {
  target: number;
  words: string;
  /** Two-digit numbers shown as buttons; contains `target` exactly once. */
  options: number[];
}

type Rng = () => number;

const randInt = (rng: Rng, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

/**
 * Builds a challenge. Distractors include the target's reversed digits and
 * same-tens / same-units neighbours so recognising one digit isn't enough.
 */
export function createChallenge(rng: Rng = Math.random): GateChallenge {
  // 21–98 with distinct, non-zero digits so the reversed number is a valid distractor.
  let target: number;
  do {
    target = randInt(rng, 21, 98);
  } while (target % 10 === 0 || Math.floor(target / 10) === target % 10);

  const tens = Math.floor(target / 10);
  const unit = target % 10;
  const preferred = [
    unit * 10 + tens,
    tens * 10 + ((unit % 9) + 1),
    ((tens % 9) + 1) * 10 + unit,
  ];

  const options = new Set<number>([target]);
  for (const d of preferred) {
    if (options.size >= OPTION_COUNT) break;
    if (d >= 10 && d <= 99) options.add(d);
  }
  for (let tries = 0; options.size < OPTION_COUNT && tries < 200; tries++) {
    options.add(randInt(rng, 10, 99));
  }
  // Guarantees termination even with a degenerate rng.
  for (let n = 10; options.size < OPTION_COUNT; n++) options.add(n);

  // Fisher–Yates shuffle
  const list = [...options];
  for (let i = list.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return { target, words: vietnameseNumberWords(target), options: list };
}
