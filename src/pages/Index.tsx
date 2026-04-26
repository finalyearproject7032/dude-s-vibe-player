import { useEffect, useState } from "react";
import { AudioEngine } from "@/lib/audioEngine";
import { useVibeColor } from "@/lib/useVibeColor";
import { usePlayer } from "@/lib/playerStore";
import type { Song } from "@/lib/types";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { NowPlaying } from "@/components/NowPlaying";
import { HomeView } from "@/views/HomeView";
import { LibraryView } from "@/views/LibraryView";
import { SearchView } from "@/views/SearchView";
import { AddSongView } from "@/views/AddSongView";
import { GalleryView } from "@/views/GalleryView";
import { useLyrics } from "@/lib/lyricsStore";
import { BUILT_IN_LYRICS } from "@/lib/builtInLyrics";

const Index = () => {
  useVibeColor();

  // Seed built-in lyrics once (don't overwrite user edits)
  useEffect(() => {
    const existing = useLyrics.getState().lyrics;
    const setLyrics = useLyrics.getState().setLyrics;
    for (const [id, raw] of Object.entries(BUILT_IN_LYRICS)) {
      if (!existing[id]) setLyrics(id, raw);
    }
  }, []);
  const [tab, setTab] = useState<Tab>("home");
  const [npOpen, setNpOpen] = useState(false);
  const playSong = usePlayer((s) => s.playSong);
  const currentId = usePlayer((s) => s.currentId);
  const songs = usePlayer((s) => s.songs);

  const onPlay = (song: Song, queue?: string[]) => {
    playSong(song.id, queue);
    setNpOpen(true);
  };

  // ===== Deep link: /s/:id?t=42 =====
  useEffect(() => {
    const m = window.location.pathname.match(/^\/s\/([^/]+)\/?$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const params = new URLSearchParams(window.location.search);
    const t = Number(params.get("t") ?? "0");
    const target = songs.find((s) => s.id === id);
    if (target) {
      playSong(target.id);
      setNpOpen(true);
      if (t > 0) {
        // wait for audio src to load
        setTimeout(() => {
          const a = document.querySelector("audio");
          if (a) a.currentTime = t;
        }, 600);
      }
      // clean URL so refresh doesn't re-trigger after navigation
      window.history.replaceState({}, "", "/");
    }
    // intentionally only run once on first mount with the songs list available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen">
      <AudioEngine />

      <main className="relative z-10 mx-auto max-w-md px-4 pt-6">
        {tab === "home" && <HomeView onPlay={onPlay} />}
        {tab === "search" && <SearchView onPlay={onPlay} />}
        {tab === "add" && <AddSongView onAdded={() => setTab("library")} />}
        {tab === "library" && <LibraryView onPlay={onPlay} />}
        {tab === "gallery" && <GalleryView />}
      </main>

      {currentId && <MiniPlayer onExpand={() => setNpOpen(true)} />}
      <BottomNav tab={tab} onTab={setTab} />
      <NowPlaying open={npOpen} onClose={() => setNpOpen(false)} />
    </div>
  );
};

export default Index;
