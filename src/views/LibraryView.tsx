import { useMemo, useState } from "react";
import type { Song } from "@/lib/types";
import { usePlayer } from "@/lib/playerStore";
import { SongRow } from "@/components/SongRow";
import { Trash2 } from "lucide-react";

type Tab = "all" | "bro" | "telugu" | "tamil" | "moments";

type Props = { onPlay: (s: Song, queue?: string[]) => void };

export function LibraryView({ onPlay }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const songs = usePlayer((s) => s.songs);
  const liked = usePlayer((s) => s.liked);
  const moments = usePlayer((s) => s.moments);
  const deleteSong = usePlayer((s) => s.deleteSong);

  const list = useMemo(() => {
    switch (tab) {
      case "bro": return songs.filter((s) => liked.includes(s.id));
      case "telugu": return songs.filter((s) => s.language === "Telugu");
      case "tamil": return songs.filter((s) => s.language === "Tamil");
      default: return songs;
    }
  }, [songs, liked, tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bro", label: "Bro Tier" },
    { id: "telugu", label: "Telugu" },
    { id: "tamil", label: "Tamil" },
    { id: "moments", label: "Vibe Moments" },
  ];

  return (
    <div className="space-y-4 pb-32 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold">Library</h1>
        <p className="text-sm text-muted-foreground">
          {tab === "bro" ? "Bro Tier Collection — certified heat only." : "Your Dude vault."}
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold pressable border ${
              tab === t.id ? "border-vibe text-vibe bg-vibe/10" : "border-border text-foreground/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "moments" ? (
        <div className="space-y-2">
          {moments.length === 0 ? (
            <Empty msg="No vibe moments yet — tap ✨ Mark Vibe while a song plays." />
          ) : (
            moments.map((m) => {
              const s = songs.find((x) => x.id === m.songId);
              if (!s) return null;
              return (
                <div key={m.id} className="glass rounded-2xl p-3 flex items-center gap-3 animate-fade-in">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.movie} · @ {Math.floor(m.time / 60)}:{Math.floor(m.time % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onPlay(s);
                      setTimeout(() => {
                        const a = document.querySelector("audio");
                        if (a) a.currentTime = m.time;
                      }, 250);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full glass-strong text-vibe pressable"
                  >
                    Play moment
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : list.length === 0 ? (
        <Empty msg="Silence? The Dude wouldn't allow this." />
      ) : (
        <div className="space-y-1">
          {list.map((s) => (
            <div key={s.id} className="group relative">
              <SongRow song={s} onPlay={(x) => onPlay(x, list.map((y) => y.id))} />
              {!s.builtIn && (
                <button
                  onClick={() => deleteSong(s.id)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 pressable text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="mx-auto mb-4 flex items-end gap-1 h-10 justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="equalizer-bar" style={{ animationDelay: `${i * 0.12}s`, background: "hsl(var(--vibe))" }} />
        ))}
      </div>
      <div className="font-display text-lg">{msg}</div>
    </div>
  );
}
