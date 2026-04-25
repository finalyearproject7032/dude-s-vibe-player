import { useMemo } from "react";
import { usePlayer } from "@/lib/playerStore";
import { useDudeNation } from "@/lib/dudeNationStore";
import type { Song } from "@/lib/types";
import { Sparkles } from "lucide-react";

type Props = { onPlay: (s: Song, queue?: string[]) => void };

/** Deterministic-by-date pick so it changes once per day. */
function pickByDate<T>(arr: T[], salt = 0): T | undefined {
  if (arr.length === 0) return undefined;
  const d = new Date();
  const key = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate() + salt;
  return arr[key % arr.length];
}

export function DailyDude({ onPlay }: Props) {
  const songs = usePlayer((s) => s.songs);
  const quotes = useDudeNation((s) => s.quotes);

  const song = useMemo(() => pickByDate(songs, 7), [songs]);
  const quote = useMemo(() => pickByDate(quotes, 0), [quotes]);

  if (!song || !quote) return null;

  const [h1, h2] = [quote.h1, quote.h2];

  return (
    <section
      className="rounded-3xl relative overflow-hidden glass-strong p-5 animate-fade-in vibe-glow"
      style={{
        background: `linear-gradient(135deg, hsl(${h1} 80% 35% / 0.55), hsl(${h2} 75% 18% / 0.85))`,
      }}
    >
      <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full opacity-40 blur-3xl" style={{ background: `hsl(${h1} 90% 60%)` }} />
      <div className="relative">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-foreground/80">
          <Sparkles className="h-3 w-3" /> Daily Dude
        </div>
        <blockquote className="font-display text-lg font-bold leading-snug mt-2 text-balance">
          "{quote.text}"
        </blockquote>
        <div className="text-xs text-foreground/70 mt-1">— {quote.author}</div>

        <button
          onClick={() => onPlay(song, songs.map((s) => s.id))}
          className="mt-4 inline-flex items-center gap-3 rounded-2xl glass px-3 py-2 pressable text-left max-w-full"
        >
          <img
            src={song.poster ?? "/placeholder.svg"}
            alt=""
            className="h-10 w-10 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-foreground/60">Today's drop</div>
            <div className="text-sm font-semibold truncate">{song.title}</div>
          </div>
        </button>
      </div>
    </section>
  );
}
