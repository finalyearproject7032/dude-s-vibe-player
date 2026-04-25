import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tracks listening time per 10s bucket per song.
 * Used to surface "your most replayed 10 seconds".
 */
export const BUCKET = 10; // seconds per bucket

type State = {
  // songId -> bucketIndex -> seconds listened
  heat: Record<string, Record<number, number>>;
  /** Add `seconds` of listening to the bucket containing `time` */
  tick: (songId: string, time: number, seconds: number) => void;
  /** Returns top { startSec, score } for a song, or null */
  topMoment: (songId: string) => { start: number; end: number; score: number } | null;
  reset: (songId?: string) => void;
};

export const useReplay = create<State>()(
  persist(
    (set, get) => ({
      heat: {},
      tick: (songId, time, seconds) => {
        if (!Number.isFinite(time) || time < 0 || seconds <= 0) return;
        const bucket = Math.floor(time / BUCKET);
        const heat = { ...get().heat };
        const songMap = { ...(heat[songId] ?? {}) };
        songMap[bucket] = (songMap[bucket] ?? 0) + seconds;
        heat[songId] = songMap;
        set({ heat });
      },
      topMoment: (songId) => {
        const m = get().heat[songId];
        if (!m) return null;
        let bestB = -1;
        let bestV = 0;
        for (const [k, v] of Object.entries(m)) {
          if (v > bestV) { bestV = v; bestB = Number(k); }
        }
        // require at least 2× one full play of the bucket to call it "most replayed"
        if (bestB < 0 || bestV < BUCKET * 1.5) return null;
        return { start: bestB * BUCKET, end: (bestB + 1) * BUCKET, score: bestV };
      },
      reset: (songId) =>
        set({
          heat: songId
            ? { ...get().heat, [songId]: {} }
            : {},
        }),
    }),
    { name: "dudify-replay-heat" }
  )
);
