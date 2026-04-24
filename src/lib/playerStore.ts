import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song, VibeMoment, Loop, Lang, Mood } from "./types";
import { BUILT_IN_SONGS } from "./builtInSongs";

type LangFilter = "All" | Lang;

type State = {
  songs: Song[];                      // all songs (builtin + user-added)
  liked: string[];
  moments: VibeMoment[];
  recents: string[];                  // recent song ids
  langFilter: LangFilter;
  moodFilter: Mood | "All";
  // Player
  currentId: string | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  loop: Loop;                         // A-B loop
  position: number;
  duration: number;
  queue: string[];
  // actions
  setLangFilter: (l: LangFilter) => void;
  setMoodFilter: (m: Mood | "All") => void;
  addUserSong: (s: Omit<Song, "id" | "builtIn" | "vibe" | "quote"> & { vibe?: [number, number]; quote?: string }) => void;
  deleteSong: (id: string) => void;
  toggleLike: (id: string) => void;
  addMoment: (songId: string, time: number, label?: string) => void;
  removeMoment: (id: string) => void;
  setLoop: (l: Loop) => void;
  // playback
  playSong: (id: string, queue?: string[]) => void;
  togglePlay: () => void;
  setIsPlaying: (b: boolean) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPosition: (p: number) => void;
  setDuration: (d: number) => void;
};

const VIBE_POOL: [number, number][] = [
  [258, 330], [12, 280], [340, 30], [300, 200], [190, 280],
  [170, 270], [220, 290], [350, 260], [320, 220], [50, 290],
];

export const usePlayer = create<State>()(
  persist(
    (set, get) => ({
      songs: BUILT_IN_SONGS,
      liked: [],
      moments: [],
      recents: [],
      langFilter: "All",
      moodFilter: "All",
      currentId: null,
      isPlaying: false,
      shuffle: false,
      repeat: "off",
      loop: null,
      position: 0,
      duration: 0,
      queue: BUILT_IN_SONGS.map((s) => s.id),

      setLangFilter: (l) => set({ langFilter: l }),
      setMoodFilter: (m) => set({ moodFilter: m }),

      addUserSong: (s) => {
        const id = `user-${Date.now()}`;
        const vibe = s.vibe ?? VIBE_POOL[Math.floor(Math.random() * VIBE_POOL.length)];
        const quote = s.quote ?? "Fresh drop in the Dude vault. Press play and find out.";
        const newSong: Song = { ...s, id, vibe, quote, builtIn: false };
        set({ songs: [newSong, ...get().songs] });
      },
      deleteSong: (id) =>
        set({
          songs: get().songs.filter((s) => s.id !== id),
          liked: get().liked.filter((x) => x !== id),
          moments: get().moments.filter((m) => m.songId !== id),
          recents: get().recents.filter((x) => x !== id),
          currentId: get().currentId === id ? null : get().currentId,
        }),
      toggleLike: (id) =>
        set({
          liked: get().liked.includes(id)
            ? get().liked.filter((x) => x !== id)
            : [id, ...get().liked],
        }),
      addMoment: (songId, time, label) =>
        set({
          moments: [
            { id: `m-${Date.now()}`, songId, time, label, createdAt: Date.now() },
            ...get().moments,
          ],
        }),
      removeMoment: (id) => set({ moments: get().moments.filter((m) => m.id !== id) }),
      setLoop: (l) => set({ loop: l }),

      playSong: (id, queue) => {
        const recents = [id, ...get().recents.filter((x) => x !== id)].slice(0, 20);
        set({
          currentId: id,
          isPlaying: true,
          position: 0,
          loop: null,
          recents,
          queue: queue && queue.length ? queue : get().queue,
        });
      },
      togglePlay: () => set({ isPlaying: !get().isPlaying }),
      setIsPlaying: (b) => set({ isPlaying: b }),
      next: () => {
        const { queue, currentId, shuffle, repeat } = get();
        if (!currentId) return;
        if (repeat === "one") {
          set({ position: 0, isPlaying: true });
          return;
        }
        const idx = queue.indexOf(currentId);
        let nextIdx = idx + 1;
        if (shuffle) nextIdx = Math.floor(Math.random() * queue.length);
        if (nextIdx >= queue.length) {
          if (repeat === "all") nextIdx = 0;
          else { set({ isPlaying: false, position: 0 }); return; }
        }
        get().playSong(queue[nextIdx], queue);
      },
      prev: () => {
        const { queue, currentId, position } = get();
        if (!currentId) return;
        if (position > 4) { set({ position: 0 }); return; }
        const idx = queue.indexOf(currentId);
        const prevIdx = idx - 1 < 0 ? queue.length - 1 : idx - 1;
        get().playSong(queue[prevIdx], queue);
      },
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () =>
        set({
          repeat: get().repeat === "off" ? "all" : get().repeat === "all" ? "one" : "off",
        }),
      setPosition: (p) => set({ position: p }),
      setDuration: (d) => set({ duration: d }),
    }),
    {
      name: "dudify-store",
      partialize: (s) => ({
        songs: s.songs.filter((x) => !x.builtIn || x.poster), // keep custom posters
        liked: s.liked,
        moments: s.moments,
        recents: s.recents,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        // Rehydrate: keep built-in songs from code + user-added from storage
        const userSongs = (p.songs ?? []).filter((s) => !s.builtIn);
        const songs = [...BUILT_IN_SONGS, ...userSongs];
        return {
          ...current,
          ...p,
          songs,
          queue: songs.map((s) => s.id),
        } as State;
      },
    }
  )
);

export const selectCurrent = (s: State) =>
  s.currentId ? s.songs.find((x) => x.id === s.currentId) ?? null : null;
