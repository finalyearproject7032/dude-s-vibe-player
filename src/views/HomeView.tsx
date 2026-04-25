import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang, Mood, Song } from "@/lib/types";
import { selectCurrent, usePlayer } from "@/lib/playerStore";
import { SongRow } from "@/components/SongRow";
import { AlbumArt } from "@/components/AlbumArt";
import { timeOfDayGreeting } from "@/lib/playerUtils";
import { useDudeNation } from "@/lib/dudeNationStore";
import { DudeNationEditor } from "@/components/DudeNationEditor";
import { DailyDude } from "@/components/DailyDude";
import { MoodMixes } from "@/components/MoodMixes";
import { SettingsSheet } from "@/components/SettingsSheet";

const MOODS: (Mood | "All")[] = ["All", "Hype", "Mass", "Melody", "Emotional", "BGM"];
const LANGS: ("All" | Lang)[] = ["All", "Telugu", "Tamil"];

type Props = { onPlay: (s: Song, queue?: string[]) => void };

export function HomeView({ onPlay }: Props) {
  const songs = usePlayer((s) => s.songs);
  const recents = usePlayer((s) => s.recents);
  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const lang = usePlayer((s) => s.langFilter);
  const mood = usePlayer((s) => s.moodFilter);
  const setLang = usePlayer((s) => s.setLangFilter);
  const setMood = usePlayer((s) => s.setMoodFilter);
  const quotes = useDudeNation((s) => s.quotes);

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

  // Hero: prefer currently playing, else most recent, else first filtered
  const heroSong: Song | undefined =
    current ??
    (recents[0] ? songs.find((s) => s.id === recents[0]) : undefined) ??
    filtered[0];

  const recentSongs = recents.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[];

  // ==== Dude Nation: scroll-driven glow ====
  const dnScrollRef = useRef<HTMLDivElement>(null);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  useEffect(() => {
    const el = dnScrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = el.scrollLeft + el.clientWidth / 2;
        const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-quote-card]"));
        let bestIdx = 0;
        let bestDist = Infinity;
        cards.forEach((c, i) => {
          const cardCenter = c.offsetLeft + c.offsetWidth / 2;
          const d = Math.abs(cardCenter - center);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        setActiveQuoteIdx(bestIdx);
      });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [quotes.length]);

  const activeQuote = quotes[activeQuoteIdx] ?? quotes[0];
  const dnGlowStyle = activeQuote
    ? ({
        // expose hues for nested elements that want to tint
        ["--dn-h1" as string]: `${activeQuote.h1}`,
        ["--dn-h2" as string]: `${activeQuote.h2}`,
        background: `radial-gradient(120% 80% at 50% 0%, hsl(${activeQuote.h1} 80% 55% / 0.18), transparent 60%), radial-gradient(120% 80% at 50% 100%, hsl(${activeQuote.h2} 75% 45% / 0.15), transparent 60%)`,
      } as React.CSSProperties)
    : undefined;

  const heroVibe = heroSong?.vibe ?? [258, 172];

  return (
    <div className="space-y-6 pb-32 animate-fade-in">
      <header className="px-1 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Dude Nation</div>
          <h1 className="font-display text-3xl font-bold leading-tight text-balance">
            The Dude's World, <span className="vibe-text">{timeOfDayGreeting()}.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your vibe. His songs. Zero rupees.</p>
        </div>
        <SettingsSheet />
      </header>

      <DailyDude onPlay={onPlay} />

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

      {/* Hero — Now Dropping (live updates with current song + poster) */}
      {heroSong && (
        <button
          key={heroSong.id}
          onClick={() => onPlay(heroSong, filtered.map((x) => x.id))}
          className="relative block w-full overflow-hidden rounded-3xl glass-strong p-5 text-left pressable vibe-glow animate-scale-in"
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background: `linear-gradient(135deg, hsl(${heroVibe[0]} 85% 45% / 0.85), hsl(${heroVibe[1]} 80% 30% / 0.85))`,
            }}
          />
          <div className="absolute inset-0 bg-background/40" />
          <div className="relative flex items-center gap-4">
            <AlbumArt song={heroSong} size={96} spin={isPlaying} className="rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-widest text-foreground/80">
                {current && isPlaying ? "Now Playing" : "Now Dropping"}
              </div>
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

      {/* Dude Nation — feel quotes (scroll-driven glow) */}
      <section
        className="pt-2 -mx-4 px-4 py-4 rounded-3xl transition-[background] duration-500"
        style={dnGlowStyle}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Dude Nation</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">for all the Dude lovers</span>
            <DudeNationEditor />
          </div>
        </div>
        <div
          ref={dnScrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x snap-mandatory"
        >
          {quotes.map((q, i) => {
            const isActive = i === activeQuoteIdx;
            return (
              <article
                key={q.id}
                data-quote-card
                style={{
                  animationDelay: `${i * 70}ms`,
                  background: `linear-gradient(135deg, hsl(${q.h1} 80% 22% / 0.55), hsl(${q.h2} 75% 14% / 0.55))`,
                  boxShadow: isActive
                    ? `0 10px 40px -10px hsl(${q.h1} 90% 55% / 0.55)`
                    : undefined,
                }}
                className={`snap-center shrink-0 w-[78%] sm:w-[46%] md:w-[34%] rounded-3xl glass-strong p-5 animate-fade-in relative overflow-hidden transition-transform duration-300 min-h-[180px] ${
                  isActive ? "scale-[1.02]" : "scale-[0.97] opacity-80"
                }`}
              >
                {q.poster && (
                  <>
                    <img
                      src={q.poster}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${q.h1} 80% 18% / 0.65), hsl(${q.h2} 75% 10% / 0.85))`,
                      }}
                    />
                  </>
                )}
                <div
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
                  style={{ background: `hsl(${q.h1} 90% 60%)` }}
                />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">{q.tag}</div>
                  <blockquote className="font-display text-lg font-bold leading-snug mt-2 text-balance">
                    "{q.text}"
                  </blockquote>
                  <div className="mt-3 text-xs text-foreground/60">— {q.author}</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
