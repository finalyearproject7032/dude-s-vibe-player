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

      {/* Dude Nation — feel quotes */}
      <section className="pt-2">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Dude Nation</h2>
          <span className="text-xs text-muted-foreground">for all the Dude lovers</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory">
          {DUDE_NATION_QUOTES.map((q, i) => (
            <article
              key={i}
              style={{
                animationDelay: `${i * 70}ms`,
                background: `linear-gradient(135deg, hsl(${q.h1} 80% 22% / 0.55), hsl(${q.h2} 75% 14% / 0.55))`,
              }}
              className="snap-start shrink-0 w-[78%] sm:w-[46%] md:w-[34%] rounded-3xl glass-strong p-5 vibe-glow animate-fade-in relative overflow-hidden"
            >
              <div
                className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
                style={{ background: `hsl(${q.h1} 90% 60%)` }}
              />
              <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">{q.tag}</div>
              <blockquote className="font-display text-lg font-bold leading-snug mt-2 text-balance">
                "{q.text}"
              </blockquote>
              <div className="mt-3 text-xs text-foreground/60">— {q.author}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const DUDE_NATION_QUOTES: { text: string; author: string; tag: string; h1: number; h2: number }[] = [
  { text: "Some bros lift weights. The Dude lifts vibes.", author: "Dude Nation", tag: "Mass Energy", h1: 280, h2: 330 },
  { text: "Play it loud enough and even silence asks for a re-run.", author: "Bro Tier", tag: "Hype", h1: 12, h2: 280 },
  { text: "Heartbreak hits. Dude songs hug back.", author: "Late Night Loop", tag: "Emotional", h1: 220, h2: 290 },
  { text: "We don't follow the trend. The Dude IS the trend.", author: "The Universe", tag: "Statement", h1: 340, h2: 30 },
  { text: "One earphone for you, one for the Dude. That's the rule.", author: "Bus Window Gang", tag: "Melody", h1: 300, h2: 200 },
  { text: "Telugu or Tamil — the Dude speaks fluent feel.", author: "Dude Nation", tag: "Universal", h1: 190, h2: 280 },
  { text: "Replay isn't a button. It's a lifestyle.", author: "Repeat One Club", tag: "Loop Life", h1: 258, h2: 172 },
];
