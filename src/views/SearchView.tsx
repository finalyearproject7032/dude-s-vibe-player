import { useMemo, useState } from "react";
import type { Song } from "@/lib/types";
import { usePlayer } from "@/lib/playerStore";
import { SongRow } from "@/components/SongRow";
import { Search } from "lucide-react";

type Props = { onPlay: (s: Song, queue?: string[]) => void };

export function SearchView({ onPlay }: Props) {
  const songs = usePlayer((s) => s.songs);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "Telugu" | "Tamil">("All");

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return songs.filter((s) => {
      if (filter !== "All" && s.language !== filter) return false;
      if (!ql) return true;
      return (
        s.title.toLowerCase().includes(ql) ||
        s.movie.toLowerCase().includes(ql) ||
        s.mood.toLowerCase().includes(ql) ||
        (s.singer ?? "").toLowerCase().includes(ql)
      );
    });
  }, [songs, q, filter]);

  return (
    <div className="space-y-4 pb-32 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Search</h1>

      <div className="glass-strong rounded-2xl flex items-center gap-2 px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a Dude banger..."
          className="flex-1 bg-transparent py-3 outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-2">
        {(["All", "Telugu", "Tamil"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold pressable border ${
              filter === l ? "border-vibe text-vibe bg-vibe/10" : "border-border text-foreground/70"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="font-display text-lg">Even Ctrl+F can't find this one.</div>
          <div className="text-sm text-muted-foreground">Try another banger.</div>
        </div>
      ) : (
        <div className="space-y-1">
          {results.map((s) => (
            <SongRow key={s.id} song={s} onPlay={(x) => onPlay(x, results.map((y) => y.id))} />
          ))}
        </div>
      )}
    </div>
  );
}
