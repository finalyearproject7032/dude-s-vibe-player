import { useMemo } from "react";
import type { Lang, Mood, Song } from "@/lib/types";
import { usePlayer } from "@/lib/playerStore";
import { SongRow } from "@/components/SongRow";
import { timeOfDayGreeting } from "@/lib/playerUtils";

const MOODS: (Mood | "All")[] = ["All", "Hype", "Mass", "Melody", "Emotional", "BGM"];
const LANGS: ("All" | Lang)[] = ["All", "Telugu", "Tamil"];

type Props = { onPlay: (s: Song, queue?: string[]) => void };

export function HomeView({ onPlay }: Props) {
  const songs = usePlayer((s) => s.songs);
  const recents = usePlayer((s) => s.recents);
  const lang = usePlayer((s) => s.langFilter);
  const mood = usePlayer((s) => s.moodFilter);
  const setLang = usePlayer((s) => s.setLangFilter);
  const setMood = usePlayer((s) => s.setMoodFilter);

  const filtered = useMemo(
    () => songs.filter((s) =>
      (lang === "All" || s.language === lang) &&
      (mood === "All" || s.mood === mood)
    ),
    [songs, lang, mood]
  );

  const byMovie = useMemo(() => {
    const map = new Map<string, Song[]>();
    filtered.forEach((s) => {
      if (!map.has(s.movie)) map.set(s.movie, []);
      map.get(s.movie)!.push(s);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const heroSong = recents[0]
    ? songs.find((s) => s.id === recents[0]) ?? filtered[0]
    : filtered[0];
  const recentSongs = recents.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[];

  return (
    <div className="space-y-6 pb-32 animate-fade-in">
      <header className="px-1">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dude Nation</div>
        <h1 className="font-display text-3xl font-bold leading-tight text-balance">
          The Dude's World, <span className="vibe-text">{timeOfDayGreeting()}.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your vibe. His songs. Zero rupees.</p>
      </header>

      {/* Lang toggle */}
      <div className="flex gap-2">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold pressable border ${
              lang === l ? "border-transparent text-primary-foreground" : "border-border text-foreground/80"
            }`}
            style={lang === l ? { background: "var(--gradient-vibe)" } : undefined}
          >
            {l === "All" ? "Both" : l}
          </button>
        ))}
      </div>

      {/* Hero */}
      {heroSong && (
        <button
          onClick={() => onPlay(heroSong, filtered.map((x) => x.id))}
          className="relative block w-full overflow-hidden rounded-3xl glass-strong p-5 text-left pressable vibe-glow animate-scale-in"
        >
          <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-vibe)" }} />
          <div className="absolute inset-0 bg-background/40" />
          <div className="relative flex items-center gap-4">
            <div className="rounded-2xl overflow-hidden">
              <img
                src=""
                alt=""
                className="hidden"
              />
              <div
                className="h-24 w-24 rounded-2xl"
                style={{ background: "var(--gradient-vibe)" }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-foreground/80">Now Dropping</div>
              <div className="font-display text-xl font-bold truncate">{heroSong.title}</div>
              <div className="text-sm text-foreground/80 truncate">{heroSong.movie} · {heroSong.language}</div>
              <div className="mt-2 italic text-xs text-foreground/70 line-clamp-2">"{heroSong.quote}"</div>
            </div>
          </div>
        </button>
      )}

      {/* Mood chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold pressable border ${
              mood === m ? "border-vibe text-vibe bg-vibe/10" : "border-border text-foreground/70"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold mb-3">Recently Played</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {recentSongs.map((s) => (
              <SongRow key={s.id} song={s} onPlay={(x) => onPlay(x, recentSongs.map((y) => y.id))} variant="tile" />
            ))}
          </div>
        </section>
      )}

      {/* By Movie */}
      {byMovie.map(([movie, list], idx) => (
        <section key={movie} style={{ animationDelay: `${idx * 60}ms` }} className="animate-fade-in">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-lg font-bold">{movie}</h2>
            <span className="text-xs text-muted-foreground">{list.length} tracks</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {list.map((s) => (
              <SongRow key={s.id} song={s} onPlay={(x) => onPlay(x, list.map((y) => y.id))} variant="tile" />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="font-display text-lg">Silence? The Dude wouldn't allow this.</div>
          <div className="text-sm text-muted-foreground mt-1">Try a different language or mood.</div>
        </div>
      )}
    </div>
  );
}
