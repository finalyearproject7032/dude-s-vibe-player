import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DudeQuote = {
  id: string;
  text: string;
  author: string;
  tag: string;
  h1: number; // 0-360
  h2: number; // 0-360
  poster?: string; // optional data URL background image
};

export const DEFAULT_QUOTES: DudeQuote[] = [
  { id: "q1", text: "Some bros lift weights. The Dude lifts vibes.", author: "Dude Nation", tag: "Mass Energy", h1: 280, h2: 330 },
  { id: "q2", text: "Play it loud enough and even silence asks for a re-run.", author: "Bro Tier", tag: "Hype", h1: 12, h2: 280 },
  { id: "q3", text: "Heartbreak hits. Dude songs hug back.", author: "Late Night Loop", tag: "Emotional", h1: 220, h2: 290 },
  { id: "q4", text: "We don't follow the trend. The Dude IS the trend.", author: "The Universe", tag: "Statement", h1: 340, h2: 30 },
  { id: "q5", text: "One earphone for you, one for the Dude. That's the rule.", author: "Bus Window Gang", tag: "Melody", h1: 300, h2: 200 },
  { id: "q6", text: "Telugu or Tamil — the Dude speaks fluent feel.", author: "Dude Nation", tag: "Universal", h1: 190, h2: 280 },
  { id: "q7", text: "Replay isn't a button. It's a lifestyle.", author: "Repeat One Club", tag: "Loop Life", h1: 258, h2: 172 },
];

type State = {
  quotes: DudeQuote[];
  add: () => void;
  update: (id: string, patch: Partial<Omit<DudeQuote, "id">>) => void;
  remove: (id: string) => void;
  reset: () => void;
};

export const useDudeNation = create<State>()(
  persist(
    (set, get) => ({
      quotes: DEFAULT_QUOTES,
      add: () =>
        set({
          quotes: [
            ...get().quotes,
            {
              id: `q-${Date.now()}`,
              text: "New Dude wisdom drops here.",
              author: "Dude Nation",
              tag: "Fresh",
              h1: Math.floor(Math.random() * 360),
              h2: Math.floor(Math.random() * 360),
            },
          ],
        }),
      update: (id, patch) =>
        set({ quotes: get().quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) }),
      remove: (id) => set({ quotes: get().quotes.filter((q) => q.id !== id) }),
      reset: () => set({ quotes: DEFAULT_QUOTES }),
    }),
    { name: "dudify-dude-nation-quotes" }
  )
);
