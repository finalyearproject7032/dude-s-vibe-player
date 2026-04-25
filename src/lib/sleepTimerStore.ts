import { create } from "zustand";

type Mode = null | "endOfSong" | "duration";

type State = {
  mode: Mode;
  /** epoch ms when timer fires (only when mode === "duration") */
  endsAt: number | null;
  setEndOfSong: () => void;
  setDuration: (minutes: number) => void;
  cancel: () => void;
  /** seconds remaining for "duration" mode; null otherwise */
  secondsLeft: () => number | null;
};

export const useSleepTimer = create<State>((set, get) => ({
  mode: null,
  endsAt: null,
  setEndOfSong: () => set({ mode: "endOfSong", endsAt: null }),
  setDuration: (minutes) => set({ mode: "duration", endsAt: Date.now() + minutes * 60_000 }),
  cancel: () => set({ mode: null, endsAt: null }),
  secondsLeft: () => {
    const { mode, endsAt } = get();
    if (mode !== "duration" || !endsAt) return null;
    return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  },
}));
