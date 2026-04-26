import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Type } from "lucide-react";
import { parseLyrics, useLyrics } from "@/lib/lyricsStore";
import type { Song } from "@/lib/types";

type Props = { song: Song; position: number };

export function LyricsCard({ song, position }: Props) {
  const raw = useLyrics((s) => s.lyrics[song.id]) ?? "";
  const setLyrics = useLyrics((s) => s.setLyrics);
  const [draft, setDraft] = useState(raw);
  const [open, setOpen] = useState(false);
  const lines = useMemo(() => parseLyrics(raw), [raw]);
  const hasTimestamps = lines.some((l) => l.time !== null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current line
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

  // Auto-scroll active line into center
  useEffect(() => {
    if (activeIdx < 0 || !containerRef.current) return;
    const node = containerRef.current.querySelector<HTMLElement>(`[data-line="${activeIdx}"]`);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  if (!raw) {
    return (
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(raw); }}>
        <SheetTrigger asChild>
          <button className="text-xs text-muted-foreground hover:text-vibe inline-flex items-center gap-1 pressable">
            <Type className="h-3 w-3" /> Add lyrics
          </button>
        </SheetTrigger>
        <Editor draft={draft} setDraft={setDraft} onSave={() => { setLyrics(song.id, draft); setOpen(false); }} title={song.title} />
      </Sheet>
    );
  }

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Lyrics {hasTimestamps ? "· synced" : ""}
        </div>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(raw); }}>
          <SheetTrigger asChild>
            <button className="text-xs text-muted-foreground hover:text-vibe inline-flex items-center gap-1 pressable">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </SheetTrigger>
          <Editor draft={draft} setDraft={setDraft} onSave={() => { setLyrics(song.id, draft); setOpen(false); }} title={song.title} />
        </Sheet>
      </div>
      <div
        ref={containerRef}
        className="max-h-32 overflow-y-auto scrollbar-hide space-y-1 text-center px-1"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            data-line={i}
            className={`transition-all duration-300 leading-snug ${
              i === activeIdx
                ? "text-base font-display font-bold text-foreground scale-105"
                : hasTimestamps
                ? "text-xs text-foreground/40"
                : "text-sm text-foreground/80"
            }`}
          >
            {l.text || "♪"}
          </div>
        ))}
      </div>
    </div>
  );
}

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
