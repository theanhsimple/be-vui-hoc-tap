/**
 * Only same-site relative paths are accepted as post-login destinations
 * (prevents open redirects such as `//evil.example` or `https://…`).
 */
export function safeNextPath(raw: unknown, fallback = "/parent"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) {
    return fallback;
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  // Control characters and backslashes are never valid in our paths.
  if (/[\u0000-\u001f\\]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return fallback;
    if (url.pathname.startsWith("/auth/callback")) return fallback;
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
