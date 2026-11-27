/**
 * Break reminder timing (PRD S10). A "stint" is continuous time in the child
 * area of one browser tab; a gap of IDLE_RESET_MS without activity starts a
 * new one. Stored per tab in sessionStorage — a convenience, not a control:
 * the reminder is a gentle nudge, not a lock.
 */

export const IDLE_RESET_MS = 30 * 60_000;

export interface Stint {
  childId: string;
  startedAt: number;
  lastSeenAt: number;
}

export function parseStint(raw: string | null): Stint | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Stint>;
    return typeof v.childId === "string" &&
      typeof v.startedAt === "number" &&
      typeof v.lastSeenAt === "number"
      ? (v as Stint)
      : null;
  } catch {
    return null;
  }
}

/** Continue the stored stint, or start a new one (other child, or idle gap). */
export function touchStint(
  stored: Stint | null,
  childId: string,
  now: number,
): Stint {
  if (
    !stored ||
    stored.childId !== childId ||
    now - stored.lastSeenAt > IDLE_RESET_MS ||
    stored.startedAt > now
  )
    return { childId, startedAt: now, lastSeenAt: now };
  return { ...stored, lastSeenAt: now };
}

export function isBreakDue(
  stint: Stint,
  minutes: number | null,
  now: number,
): boolean {
  return minutes !== null && now - stint.startedAt >= minutes * 60_000;
}

/** Routes where a reminder would interrupt an activity; it waits until after. */
export function isActivityRoute(pathname: string): boolean {
  return /^\/student\/(lessons\/[^/]+\/play|discover\/)/.test(pathname);
}
