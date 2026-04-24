import { Heart } from "lucide-react";
import type { Song } from "@/lib/types";
import { selectCurrent, usePlayer } from "@/lib/playerStore";
import { AlbumArt } from "./AlbumArt";
import { Equalizer } from "./Equalizer";

type Props = {
  song: Song;
  queue?: string[];
  onPlay: (song: Song) => void;
  variant?: "row" | "tile";
};

export function SongRow({ song, onPlay, variant = "row" }: Props) {
  const liked = usePlayer((s) => s.liked.includes(song.id));
  const toggleLike = usePlayer((s) => s.toggleLike);
  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isCurrent = current?.id === song.id;

  if (variant === "tile") {
    return (
      <button
        onClick={() => onPlay(song)}
        className="group relative w-36 shrink-0 text-left pressable animate-fade-in"
      >
        <AlbumArt song={song} size={144} className="vibe-glow" />
        <div className="mt-2 truncate text-sm font-semibold">{song.title}</div>
        <div className="truncate text-xs text-muted-foreground">{song.movie}</div>
        {isCurrent && (
          <div className="absolute top-2 right-2 glass rounded-full p-1.5">
            <Equalizer active={isPlaying} />
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-xl p-2 pressable hover:bg-foreground/5 cursor-pointer animate-fade-in"
      onClick={() => onPlay(song)}
    >
      <AlbumArt song={song} size={48} />
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-semibold ${isCurrent ? "text-vibe" : ""}`}>{song.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {song.movie} · {song.language}{song.singer ? ` · ${song.singer}` : ""}
        </div>
      </div>
      {isCurrent && <Equalizer active={isPlaying} />}
      <button
        onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
        className="p-2 pressable"
        aria-label="Like"
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-highlight text-highlight" : "text-muted-foreground"}`} />
      </button>
    </div>
  );
}
