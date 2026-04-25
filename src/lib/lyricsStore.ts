import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LyricLine = { time: number | null; text: string };

/**
 * Parse LRC-style lyrics: lines like "[01:23.45] some words".
 * Lines without timestamps are kept with time=null (plain mode).
 */
export function parseLyrics(raw: string): LyricLine[] {
  const lines = raw.split(/\r?\n/);
  const out: LyricLine[] = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  for (const ln of lines) {
    const stamps: number[] = [];
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(ln)) !== null) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const ms = m[3] ? Number(m[3].padEnd(3, "0")) : 0;
      stamps.push(min * 60 + sec + ms / 1000);
    }
    const text = ln.replace(re, "").trim();
    if (!text && stamps.length === 0) continue;
    if (stamps.length === 0) {
      out.push({ time: null, text });
    } else {
      stamps.forEach((t) => out.push({ time: t, text }));
    }
  }
  // sort by time when timestamps exist
  const hasTime = out.some((l) => l.time !== null);
  if (hasTime) out.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  return out;
}

type State = {
  /** songId -> raw LRC/plain text */
  lyrics: Record<string, string>;
  setLyrics: (songId: string, raw: string) => void;
  remove: (songId: string) => void;
};

export const useLyrics = create<State>()(
  persist(
    (set, get) => ({
      lyrics: {},
      setLyrics: (songId, raw) =>
        set({ lyrics: { ...get().lyrics, [songId]: raw } }),
      remove: (songId) => {
        const next = { ...get().lyrics };
        delete next[songId];
        set({ lyrics: next });
      },
    }),
    { name: "dudify-lyrics" }
  )
);
