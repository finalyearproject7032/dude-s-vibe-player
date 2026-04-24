import { useMemo } from "react";
import type { Song } from "@/lib/types";

type Props = {
  song?: Song | null;
  size?: number;
  className?: string;
  spin?: boolean;
};

/** Album art tile. Uses gradient + monogram if no poster, else <img>. */
export function AlbumArt({ song, size = 64, className = "", spin = false }: Props) {
  const { gradient, mono } = useMemo(() => {
    const [h1, h2] = song?.vibe ?? [258, 172];
    const m = (song?.title ?? "D")
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return {
      gradient: `linear-gradient(135deg, hsl(${h1} 90% 58%), hsl(${h2} 80% 42%))`,
      mono: m || "D",
    };
  }, [song?.id]);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    background: song?.poster ? undefined : gradient,
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl shadow-card ${className}`}
      style={style}
    >
      {song?.poster ? (
        <img
          src={song.poster}
          alt={song.title}
          className={`h-full w-full object-cover ${spin ? "animate-spin-slow" : ""}`}
        />
      ) : (
        <>
          <div
            className={`absolute inset-0 ${spin ? "animate-spin-slow" : ""}`}
            style={{ background: gradient }}
          />
          <div className="absolute inset-0 grid place-items-center font-display font-bold text-primary-foreground/95"
               style={{ fontSize: size * 0.32 }}>
            {mono}
          </div>
          <div className="absolute inset-0 mix-blend-overlay opacity-50"
               style={{ background: "radial-gradient(60% 60% at 30% 20%, white, transparent)" }} />
        </>
      )}
    </div>
  );
}
