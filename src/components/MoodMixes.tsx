import { useMemo } from "react";
import { usePlayer } from "@/lib/playerStore";
import type { Song } from "@/lib/types";
import { MOOD_MIXES } from "@/lib/moodMixes";

type Props = { onPlay: (s: Song, queue?: string[]) => void };

export function MoodMixes({ onPlay }: Props) {
  const songs = usePlayer((s) => s.songs);
  const liked = usePlayer((s) => s.liked);

  const mixes = useMemo(() => {
    return MOOD_MIXES.map((m) => {
      let list = m.pick(songs);
      if (m.id === "bro-tier-only") list = songs.filter((s) => liked.includes(s.id));
      return { ...m, list };
    }).filter((m) => m.list.length > 0);
  }, [songs, liked]);

  if (mixes.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-lg font-bold mb-3">Mood Mixes</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {mixes.map((m) => {
          const first = m.list[0];
          return (
            <button
              key={m.id}
              onClick={() => first && onPlay(first, m.list.map((s) => s.id))}
              className="snap-center shrink-0 w-44 h-32 rounded-2xl glass-strong relative overflow-hidden text-left p-3 pressable vibe-glow animate-fade-in"
              style={{
                background: `linear-gradient(135deg, hsl(${m.hues[0]} 80% 40% / 0.7), hsl(${m.hues[1]} 75% 22% / 0.85))`,
              }}
            >
              <div
                className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-50 blur-2xl"
                style={{ background: `hsl(${m.hues[0]} 90% 60%)` }}
              />
              <div className="relative h-full flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/80">
                    {m.list.length} tracks
                  </div>
                  <div className="font-display text-base font-bold leading-tight mt-0.5">{m.title}</div>
                </div>
                <div className="text-[11px] text-foreground/80 line-clamp-2">{m.blurb}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
