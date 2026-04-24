import { Pause, Play } from "lucide-react";
import { selectCurrent, usePlayer } from "@/lib/playerStore";
import { AlbumArt } from "./AlbumArt";
import { Equalizer } from "./Equalizer";

type Props = { onExpand: () => void };

export function MiniPlayer({ onExpand }: Props) {
  const song = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);

  if (!song) return null;
  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-2 bottom-[68px] safe-bottom z-30 animate-slide-up">
      <div
        className="glass-strong rounded-2xl overflow-hidden shadow-card cursor-pointer"
        onClick={onExpand}
      >
        <div className="relative h-[2px] bg-foreground/10">
          <div className="absolute left-0 top-0 h-full transition-[width] duration-300"
               style={{ width: `${pct}%`, background: "var(--gradient-vibe)" }} />
        </div>
        <div className="flex items-center gap-3 p-2 pr-3">
          <AlbumArt song={song} size={44} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{song.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {song.movie} · {song.language}
            </div>
          </div>
          <Equalizer active={isPlaying} className="mr-1" />
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="grid place-items-center h-9 w-9 rounded-full pressable"
            style={{ background: "var(--gradient-vibe)" }}
            aria-label="Play/Pause"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-primary-foreground text-primary-foreground" /> : <Play className="h-4 w-4 ml-0.5 fill-primary-foreground text-primary-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
}
