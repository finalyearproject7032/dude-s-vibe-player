import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GalleryItem = {
  id: string;
  src: string;        // data URL
  caption?: string;
  createdAt: number;
};

type State = {
  items: GalleryItem[];
  add: (src: string, caption?: string) => void;
  updateCaption: (id: string, caption: string) => void;
  remove: (id: string) => void;
};

export const useDudeGallery = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      add: (src, caption) =>
        set({
          items: [
            { id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, src, caption, createdAt: Date.now() },
            ...get().items,
          ],
        }),
      updateCaption: (id, caption) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, caption } : i)) }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    { name: "dudify-dude-gallery" }
  )
);
