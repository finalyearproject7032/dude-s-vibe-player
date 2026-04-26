import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Maximize2, Pencil, Type, X } from "lucide-react";
import { parseLyrics, useLyrics } from "@/lib/lyricsStore";
import { usePlayer } from "@/lib/playerStore";
import type { Song } from "@/lib/types";

type Props = { song: Song; position: number };

export function LyricsCard({ song, position }: Props) {
  const raw = useLyrics((s) => s.lyrics[song.id]) ?? "";
  const setLyrics = useLyrics((s) => s.setLyrics);
  const [draft, setDraft] = useState(raw);
  const [editorOpen, setEditorOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const lines = useMemo(() => parseLyrics(raw), [raw]);
  const hasTimestamps = lines.some((l) => l.time !== null);

  // Find current synced line
  const activeIdx = useMemo(() => {
    if (!hasTimestamps) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].time;
      if (t != null && t <= position) idx = i;
      else if (t != null && t > position) break;
    }
    return idx;
  }, [lines, position, hasTimestamps]);

  // ----- Empty state: invite to add -----
  if (!raw) {
    return (
      <Sheet open={editorOpen} onOpenChange={(o) => { setEditorOpen(o); if (o) setDraft(raw); }}>
        <SheetTrigger asChild>
          <button className="w-full glass rounded-2xl p-3 text-xs text-muted-foreground hover:text-vibe inline-flex items-center justify-center gap-2 pressable">
            <Type className="h-3.5 w-3.5" /> Add lyrics for this song
          </button>
        </SheetTrigger>
        <Editor draft={draft} setDraft={setDraft} onSave={() => { setLyrics(song.id, draft); setEditorOpen(false); }} title={song.title} />
      </Sheet>
    );
  }

  // ----- Compact preview shown inside Now Playing -----
  return (
    <>
      <button
        onClick={() => setFullOpen(true)}
        className="w-full glass rounded-2xl p-3 text-left pressable group"
        aria-label="Open full lyrics"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Lyrics {hasTimestamps ? "· synced" : ""}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-vibe inline-flex items-center gap-1 group-hover:underline">
              <Maximize2 className="h-3 w-3" /> Open
            </span>
          </div>
        </div>

        {hasTimestamps ? (
          <KaraokePreview lines={lines} activeIdx={activeIdx} />
        ) : (
          <PlainPreview lines={lines} />
        )}
      </button>

      {/* Full-screen lyrics view */}
      <FullLyrics
        open={fullOpen}
        onClose={() => setFullOpen(false)}
        song={song}
        lines={lines}
        activeIdx={activeIdx}
        hasTimestamps={hasTimestamps}
        onEdit={() => { setDraft(raw); setEditorOpen(true); setFullOpen(false); }}
      />

      {/* Editor sheet (shared) */}
      <Sheet open={editorOpen} onOpenChange={(o) => { setEditorOpen(o); if (o) setDraft(raw); }}>
        <SheetTrigger asChild><span hidden /></SheetTrigger>
        <Editor draft={draft} setDraft={setDraft} onSave={() => { setLyrics(song.id, draft); setEditorOpen(false); }} title={song.title} />
      </Sheet>
    </>
  );
}

/* ---------------- Compact previews ---------------- */

function KaraokePreview({ lines, activeIdx }: { lines: ReturnType<typeof parseLyrics>; activeIdx: number }) {
  const prev = activeIdx > 0 ? lines[activeIdx - 1]?.text : "";
  const curr = activeIdx >= 0 ? lines[activeIdx]?.text : lines[0]?.text;
  const next = activeIdx >= 0 && activeIdx + 1 < lines.length ? lines[activeIdx + 1]?.text : "";
  return (
    <div className="text-center space-y-1 py-1">
      <div className="text-[11px] text-foreground/40 truncate">{prev || "♪"}</div>
      <div className="text-base font-display font-bold text-foreground leading-snug text-balance">
        {curr || "♪"}
      </div>
      <div className="text-[11px] text-foreground/40 truncate">{next || "♪"}</div>
    </div>
  );
}

function PlainPreview({ lines }: { lines: ReturnType<typeof parseLyrics> }) {
  // Show first 3 non-empty lines as a teaser
  const teaser = lines.filter((l) => l.text).slice(0, 3);
  return (
    <div className="text-center space-y-0.5">
      {teaser.map((l, i) => (
        <div key={i} className="text-sm text-foreground/85 leading-snug truncate">
          {l.text}
        </div>
      ))}
      <div className="text-[10px] text-vibe pt-1">Tap to read full lyrics</div>
    </div>
  );
}

/* ---------------- Full-screen lyrics view ---------------- */

function FullLyrics({
  open,
  onClose,
  song,
  lines,
  activeIdx,
  hasTimestamps,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  song: Song;
  lines: ReturnType<typeof parseLyrics>;
  activeIdx: number;
  hasTimestamps: boolean;
  onEdit: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active line to center
  useEffect(() => {
    if (!open || activeIdx < 0 || !scrollRef.current) return;
    const node = scrollRef.current.querySelector<HTMLElement>(`[data-line="${activeIdx}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, activeIdx]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);

  const seekTo = (t: number | null) => {
    if (t == null) return;
    usePlayer.getState().setPosition(t);
    const a = document.querySelector("audio");
    if (a) a.currentTime = t;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-3xl animate-in fade-in duration-300">
      {/* Vibe glow background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--vibe) / 0.45), transparent 70%), radial-gradient(60% 50% at 50% 100%, hsl(var(--vibe) / 0.35), transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={onClose} className="glass rounded-full p-2 pressable" aria-label="Close lyrics">
          <X className="h-5 w-5" />
        </button>
        <div className="text-center min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Lyrics {hasTimestamps ? "· synced" : ""}
          </div>
          <div className="font-display font-bold text-base truncate">{song.title}</div>
        </div>
        <button
          onClick={onEdit}
          className="glass rounded-full p-2 pressable"
          aria-label="Edit lyrics"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Scrolling lyrics */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-6 pb-24"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, black 60px, black calc(100% - 120px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, black 60px, black calc(100% - 120px), transparent 100%)",
        }}
      >
        <div className="max-w-xl mx-auto py-[35vh] space-y-4 text-center">
          {lines.map((l, i) => {
            const isActive = i === activeIdx;
            const distance = activeIdx >= 0 ? Math.abs(i - activeIdx) : 0;
            const dim =
              hasTimestamps && !isActive
                ? distance === 1
                  ? "text-foreground/55"
                  : distance === 2
                  ? "text-foreground/35"
                  : "text-foreground/20"
                : "text-foreground/85";
            return (
              <div
                key={i}
                data-line={i}
                onClick={() => hasTimestamps && seekTo(l.time)}
                className={`transition-all duration-500 leading-snug text-balance ${
                  hasTimestamps ? "cursor-pointer" : ""
                } ${
                  isActive
                    ? "font-display font-bold text-foreground scale-[1.06] text-2xl sm:text-3xl"
                    : `text-lg sm:text-xl ${dim}`
                }`}
                style={
                  isActive
                    ? { textShadow: "0 0 24px hsl(var(--vibe) / 0.55)" }
                    : undefined
                }
              >
                {l.text || "♪"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Editor sheet ---------------- */

function Editor({
  draft,
  setDraft,
  onSave,
  title,
}: { draft: string; setDraft: (v: string) => void; onSave: () => void; title: string }) {
  return (
    <SheetContent side="bottom" className="bg-background/95 backdrop-blur rounded-t-3xl max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="font-display">Lyrics — {title}</SheetTitle>
        <SheetDescription>Paste plain lyrics or LRC for karaoke-style sync.</SheetDescription>
      </SheetHeader>
      <div className="mt-3 space-y-3 pb-6">
        <p className="text-xs text-muted-foreground">
          Paste plain lyrics, or LRC format like <code className="bg-foreground/10 px-1 rounded">[01:23.45] line</code> for karaoke sync.
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          placeholder="[00:14.20] Nallaru po po…"
          className="bg-background/60 font-mono text-xs"
        />
        <Button onClick={onSave} className="w-full">Save lyrics</Button>
      </div>
    </SheetContent>
  );
}
