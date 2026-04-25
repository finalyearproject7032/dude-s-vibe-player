import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  crossfadeSec: number; // 0 = off, 1..8
  setCrossfade: (n: number) => void;
};

export const useSettings = create<State>()(
  persist(
    (set) => ({
      crossfadeSec: 0,
      setCrossfade: (n) => set({ crossfadeSec: Math.max(0, Math.min(8, Math.round(n))) }),
    }),
    { name: "dudify-settings" }
  )
);
