"use client";

import { useSyncExternalStore } from "react";

import { deviceStateSchema, type DeviceState, emptyState } from "./state";

/**
 * DEVICE EDITION persistence: one JSON document in localStorage, validated
 * on every load. Writes are synchronous and atomic (one setItem). Other tabs
 * are kept in sync through the `storage` event.
 *
 * Browsers may clear site data (Safari after weeks without visits unless the
 * app is added to the Home Screen), so parents are offered a backup file.
 */

export const STORAGE_KEY = "little.device.v1";

let cache: DeviceState | null = null;
let loadError: string | null = null;
const listeners = new Set<() => void>();

function read(): DeviceState {
  const now = new Date().toISOString();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    loadError = "storage_unavailable";
    return emptyState(now);
  }
  if (!raw) return emptyState(now);
  try {
    const parsed = deviceStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // fall through
  }
  // Never silently discard data: keep the unreadable copy for recovery.
  try {
    localStorage.setItem(`${STORAGE_KEY}.unreadable.${Date.now()}`, raw);
  } catch {
    // ignore
  }
  loadError = "data_unreadable";
  return emptyState(now);
}

export function getDeviceState(): DeviceState {
  cache ??= read();
  return cache;
}

export function deviceLoadError(): string | null {
  getDeviceState();
  return loadError;
}

function persist(next: DeviceState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    loadError = "storage_full";
  }
  for (const l of listeners) l();
}

/** Applies a pure update and saves it. Returns whatever the updater returns. */
export function updateDevice<T>(
  fn: (s: DeviceState) => { state: DeviceState; result: T },
): T {
  const { state, result } = fn(getDeviceState());
  if (state !== cache) persist(state);
  return result;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The stored state, or null while prerendering / before hydration. */
export function useDeviceState(): DeviceState | null {
  return useSyncExternalStore(subscribe, getDeviceState, () => null);
}

// ── Backup ──────────────────────────────────────────────────────────────

export function backupFile(): { name: string; json: string } {
  const now = new Date();
  const state = updateDevice((s) => {
    const next = { ...s, lastBackupAt: now.toISOString() };
    return { state: next, result: next };
  });
  return {
    name: `little-sao-luu-${now.toISOString().slice(0, 10)}.json`,
    json: JSON.stringify(state, null, 2),
  };
}

/** Replaces everything with a backup file's content (validated first). */
export function restoreBackup(text: string): { ok: true } | { ok: false } {
  try {
    const parsed = deviceStateSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return { ok: false };
    persist(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function eraseDevice() {
  persist(emptyState(new Date().toISOString()));
}

/** Ask the browser to keep this site's data (best effort, Safari/Chrome). */
export function requestPersistence() {
  try {
    void navigator.storage?.persist?.();
  } catch {
    // ignore
  }
}
