"use client";

import { useEffect } from "react";

/** Registers the offline service worker (device edition, production only). */
export function ServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .catch(() => {
        // Offline support is a bonus: the app works online without it.
      });
  }, []);
  return null;
}
