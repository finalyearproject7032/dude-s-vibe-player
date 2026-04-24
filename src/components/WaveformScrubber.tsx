import { useMemo, useRef, useState } from "react";
import { fakeWaveform, fmt, haptic } from "@/lib/playerUtils";
import { usePlayer } from "@/lib/playerStore";
import { seekAudio } from "@/lib/audioEngine";
import type { VibeMoment } from "@/lib/types";

type Props = {
  songId: string;
  moments: VibeMoment[];
};

export function WaveformScrubber({ songId, moments }: Props) {
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const setPosition = usePlayer((s) => s.setPosition);
  const loop = usePlayer((s) => s.loop);

  const bars = useMemo(() => fakeWaveform(songId, 64), [songId]);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  const pct = duration > 0 ? Math.min(1, position / duration) : 0;

  const seekFromEvent = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const t = ratio * (duration || 0);
    setHover(t);
    return t;
  };

  const commit = (clientX: number) => {
    const t = seekFromEvent(clientX);
    if (t == null) return;
    setPosition(t);
    seekAudio(t);
    const lastMomentNear = moments.find((m) => Math.abs(m.time - t) < 1.5);
    haptic(lastMomentNear ? "medium" : "light");
  };

  return (
    <div className="select-none">
      <div
        ref={ref}
        className="relative h-20 cursor-pointer touch-none"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          commit(e.clientX);
        }}
        onPointerMove={(e) => {
          seekFromEvent(e.clientX);
          if (dragging.current) commit(e.clientX);
        }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; setHover(null); }}
      >
        <div className="absolute inset-0 flex items-center gap-[3px]">
          {bars.map((v, i) => {
            const barPct = (i + 0.5) / bars.length;
            const played = barPct <= pct;
            const inLoop = loop && duration > 0
              ? barPct * duration >= loop.start && barPct * duration <= loop.end
              : false;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-[height,background] duration-200"
                style={{
                  height: `${v * 100}%`,
                  background: inLoop
                    ? "hsl(var(--accent))"
                    : played
                      ? "hsl(var(--vibe))"
                      : "hsl(var(--muted-foreground) / 0.35)",
                  boxShadow: played ? "0 0 8px hsl(var(--vibe) / 0.6)" : undefined,
                }}
              />
            );
          })}
        </div>

        {/* moment markers */}
        {duration > 0 && moments.map((m) => (
          <div
            key={m.id}
            className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 rounded-full"
            style={{
              left: `${(m.time / duration) * 100}%`,
              background: "hsl(var(--highlight))",
              boxShadow: "0 0 10px hsl(var(--highlight))",
            }}
            title={`Vibe @ ${fmt(m.time)}`}
          />
        ))}

        {/* playhead glow */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-[2px] -translate-x-1/2"
          style={{
            left: `${pct * 100}%`,
            background: "hsl(var(--vibe))",
            boxShadow: "0 0 14px hsl(var(--vibe))",
          }}
        />

        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-background/80 px-2 py-0.5 text-xs glass-strong"
            style={{ left: `${(hover / (duration || 1)) * 100}%` }}
          >
            {fmt(hover)}
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{fmt(position)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}
