import { Heart, Plus, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Pause, Play, X, Sparkles, Repeat2, Share2, Moon, Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectCurrent, usePlayer } from "@/lib/playerStore";
import { ParticleField } from "./ParticleField";
import { AlbumArt } from "./AlbumArt";
import { WaveformScrubber } from "./WaveformScrubber";
import { LyricsCard } from "./LyricsCard";
import { SleepTimer } from "./SleepTimer";
import { useReplay } from "@/lib/replayStore";
import { buildShareUrl, shareOrCopy } from "@/lib/share";
import { toast } from "sonner";
import { haptic } from "@/lib/playerUtils";

type Props = { open: boolean; onClose: () => void };

export function NowPlaying({ open, onClose }: Props) {
  const song = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const shuffle = usePlayer((s) => s.shuffle);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const repeat = usePlayer((s) => s.repeat);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const liked = usePlayer((s) => s.liked);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const allMoments = usePlayer((s) => s.moments);
  const moments = useMemo(() => allMoments.filter((m) => m.songId === song?.id), [allMoments, song?.id]);
  const addMoment = usePlayer((s) => s.addMoment);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const loop = usePlayer((s) => s.loop);
  const setLoop = usePlayer((s) => s.setLoop);

  const [hearts, setHearts] = useState<number[]>([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const artRef = useRef<HTMLDivElement>(null);

  // Gyroscope tilt (mobile)
  useEffect(() => {
    if (!open) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      const x = Math.max(-15, Math.min(15, (e.gamma ?? 0) / 2));
      const y = Math.max(-15, Math.min(15, ((e.beta ?? 0) - 30) / 4));
      setTilt({ x, y });
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);

  // Scroll-to-seek on the surface
  const handleWheel = (e: React.WheelEvent) => {
    if (!duration) return;
    const delta = (e.deltaY + e.deltaX) * 0.05;
    const t = Math.max(0, Math.min(duration, position + delta));
    usePlayer.getState().setPosition(t);
    const a = document.querySelector("audio");
    if (a) a.currentTime = t;
  };

  if (!song) return null;

  const isLiked = liked.includes(song.id);

  const onLike = () => {
    toggleLike(song.id);
    haptic("light");
    if (!isLiked) setHearts((h) => [...h, Date.now()]);
  };
  const onMark = () => {
    addMoment(song.id, position, undefined);
    haptic("medium");
  };
  const onLoopToggle = () => {
    if (loop) { setLoop(null); return; }
    // start a 10s loop from current position
    const start = position;
    const end = Math.min(duration || start + 10, start + 10);
    setLoop({ start, end });
    haptic("heavy");
  };

  const top = useReplay((s) => s.topMoment(song?.id ?? ""));
  const fmt = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}`;

  const onSharePlain = async () => {
    if (!song) return;
    const url = buildShareUrl(song.id);
    const action = await shareOrCopy(`${song.title} — Dudify`, `Listen to ${song.title} on Dudify`, url);
    toast.success(action === "shared" ? "Shared!" : "Link copied — paste anywhere.");
  };
  const onShareMoment = async () => {
    if (!song) return;
    const t = top ? top.start : Math.floor(position);
    const url = buildShareUrl(song.id, t);
    const label = top ? `the most-replayed 10s of ${song.title}` : `${song.title} @ ${fmt(t)}`;
    const action = await shareOrCopy(`Listen to ${label}`, `🔥 ${label}`, url);
    toast.success(action === "shared" ? "Moment shared." : "Moment link copied 🔥");
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop sheet */}
      <div
        className={`absolute inset-0 bg-background/95 backdrop-blur-3xl transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`relative h-full w-full overflow-hidden transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
        onWheel={handleWheel}
      >
        <ParticleField active={isPlaying} className="absolute inset-0 h-full w-full opacity-90" />
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col px-5 pt-4 pb-8 safe-bottom">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="glass rounded-full p-2 pressable" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Now Playing</div>
              <div className="vibe-text text-xs font-semibold">The Dude's drop just hit different.</div>
            </div>
            <div className="w-9" />
          </div>

          {/* 3D Album art */}
          <div className="flex-1 grid place-items-center" style={{ perspective: 1000 }}>
            <div
              ref={artRef}
              className="relative"
              style={{
                transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
                transition: "transform 200ms ease-out",
              }}
            >
              <div
                className="absolute -inset-10 rounded-full blur-3xl opacity-70 animate-pulse-glow"
                style={{ background: "radial-gradient(closest-side, hsl(var(--vibe) / 0.7), transparent)" }}
              />
              <AlbumArt song={song} size={Math.min(320, window.innerWidth - 96)} spin={isPlaying} className="vibe-glow" />
            </div>
          </div>

          {/* Title + quote */}
          <div className="text-center mb-4 px-2">
            <h2 className="font-display text-2xl font-bold text-balance">{song.title}</h2>
            <p className="text-sm text-muted-foreground">{song.movie} · {song.language}{song.singer ? ` · ${song.singer}` : ""}</p>
            <p className="mt-3 text-[13px] italic text-foreground/70 text-balance">"{song.quote}"</p>
          </div>

          {/* Waveform */}
          <WaveformScrubber songId={song.id} moments={moments} />

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => { toggleShuffle(); haptic("heavy"); }}
              className={`p-3 rounded-full pressable ${shuffle ? "text-accent" : "text-muted-foreground"}`}
              aria-label="Shuffle"
            >
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={() => { prev(); haptic("light"); }} className="p-3 pressable" aria-label="Prev">
              <SkipBack className="h-7 w-7 fill-foreground" />
            </button>
            <button
              onClick={() => { togglePlay(); haptic("medium"); }}
              className="grid place-items-center h-16 w-16 rounded-full pressable vibe-glow"
              style={{ background: "var(--gradient-vibe)" }}
              aria-label="Play/Pause"
            >
              {isPlaying ? <Pause className="h-7 w-7 fill-primary-foreground text-primary-foreground" /> : <Play className="h-7 w-7 ml-1 fill-primary-foreground text-primary-foreground" />}
            </button>
            <button onClick={() => { next(); haptic("light"); }} className="p-3 pressable" aria-label="Next">
              <SkipForward className="h-7 w-7 fill-foreground" />
            </button>
            <button
              onClick={() => { cycleRepeat(); haptic("light"); }}
              className={`p-3 rounded-full pressable ${repeat !== "off" ? "text-accent" : "text-muted-foreground"}`}
              aria-label="Repeat"
            >
              {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="mt-4 flex items-center justify-around glass rounded-2xl p-2">
            <button onClick={onLike} className="relative flex flex-col items-center gap-1 px-2 py-2 pressable">
              <Heart className={`h-5 w-5 ${isLiked ? "fill-highlight text-highlight" : "text-foreground/80"}`} />
              <span className="text-[11px] text-muted-foreground">{isLiked ? "Bro Tier" : "Like"}</span>
              {hearts.map((k) => (
                <Heart
                  key={k}
                  onAnimationEnd={() => setHearts((h) => h.filter((x) => x !== k))}
                  className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-5 fill-highlight text-highlight animate-heart-burst pointer-events-none"
                />
              ))}
            </button>
            <button onClick={onMark} className="flex flex-col items-center gap-1 px-2 py-2 pressable">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-[11px] text-muted-foreground">Mark</span>
            </button>
            <button onClick={onLoopToggle} className="flex flex-col items-center gap-1 px-2 py-2 pressable">
              <Repeat2 className={`h-5 w-5 ${loop ? "text-accent" : "text-foreground/80"}`} />
              <span className="text-[11px] text-muted-foreground">{loop ? "Loop on" : "A↔B"}</span>
            </button>
            <button onClick={onSharePlain} className="flex flex-col items-center gap-1 px-2 py-2 pressable">
              <Share2 className="h-5 w-5 text-foreground/80" />
              <span className="text-[11px] text-muted-foreground">Share</span>
            </button>
            <SleepTimer
              trigger={
                <button className="flex flex-col items-center gap-1 px-2 py-2 pressable">
                  <Moon className="h-5 w-5 text-foreground/80" />
                  <span className="text-[11px] text-muted-foreground">Sleep</span>
                </button>
              }
            />
          </div>

          {/* Most-replayed callout */}
          {top && (
            <button
              onClick={onShareMoment}
              className="mt-3 w-full glass-strong rounded-2xl p-3 flex items-center gap-3 pressable text-left"
              style={{ boxShadow: "0 8px 30px -10px hsl(var(--vibe) / 0.5)" }}
            >
              <div className="grid place-items-center h-10 w-10 rounded-xl" style={{ background: "var(--gradient-vibe)" }}>
                <Flame className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Most replayed</div>
                <div className="text-sm font-semibold truncate">
                  {fmt(top.start)}–{fmt(top.end)} of {song.title}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-vibe">
                <Share2 className="h-3.5 w-3.5" /> share
              </div>
            </button>
          )}

          {/* Lyrics */}
          <div className="mt-3">
            <LyricsCard song={song} position={position} />
          </div>

          {moments.length > 0 && (
            <div className="mt-3 glass rounded-2xl p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">My Vibe Moments</div>
              <div className="flex flex-wrap gap-2">
                {moments.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      const a = document.querySelector("audio");
                      if (a) a.currentTime = m.time;
                      haptic("light");
                    }}
                    className="text-xs px-3 py-1 rounded-full glass-strong text-highlight pressable"
                  >
                    {Math.floor(m.time / 60)}:{Math.floor(m.time % 60).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
