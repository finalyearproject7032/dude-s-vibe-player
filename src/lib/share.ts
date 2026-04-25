/** Build a deep-link to a song (and optional timestamp). */
export function buildShareUrl(songId: string, timeSec?: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const t = timeSec && timeSec > 0 ? `?t=${Math.floor(timeSec)}` : "";
  return `${base}/s/${encodeURIComponent(songId)}${t}`;
}

/** Try Web Share, fall back to clipboard copy. Returns the action taken. */
export async function shareOrCopy(title: string, text: string, url: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return "shared";
    } catch {
      // fall through to copy
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
