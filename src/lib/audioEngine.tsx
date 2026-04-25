import { useEffect, useRef } from "react";
import { selectCurrent, usePlayer } from "./playerStore";
import { useReplay } from "./replayStore";
import { useSleepTimer } from "./sleepTimerStore";
import { useSettings } from "./settingsStore";

/**
 * Audio engine: dual <audio> elements for crossfade, wired to zustand.
 * Also handles MediaSession metadata, replay heat tracking, sleep timer.
 */
export function AudioEngine() {
  const aRef = useRef<HTMLAudioElement | null>(null);
  const bRef = useRef<HTMLAudioElement | null>(null);
  // which element holds the *current* song. The other one is reserved for the next crossfade.
  const activeRef = useRef<"a" | "b">("a");
  const fadeRafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const loop = usePlayer((s) => s.loop);
  const setPosition = usePlayer((s) => s.setPosition);
  const setDuration = usePlayer((s) => s.setDuration);
  const setIsPlaying = usePlayer((s) => s.setIsPlaying);
  const next = usePlayer((s) => s.next);

  const tickReplay = useReplay((s) => s.tick);

  const getActive = () => (activeRef.current === "a" ? aRef.current : bRef.current);
  const getInactive = () => (activeRef.current === "a" ? bRef.current : aRef.current);

  // Load/swap audio when current song changes
  useEffect(() => {
    const a = getActive();
    if (!a) return;
    if (!current) {
      a.pause();
      a.removeAttribute("src");
      a.load();
      const b = getInactive();
      if (b) { b.pause(); b.volume = 0; }
      return;
    }
    // Always make sure the inactive element is silent (avoids stale audio)
    const inactive = getInactive();
    if (inactive) { inactive.pause(); inactive.volume = 0; }

    if (a.src !== window.location.origin + current.src && a.src !== current.src) {
      a.src = current.src;
      a.volume = 1;
      a.load();
    }
  }, [current?.id, current?.src]);

  // Play/pause
  useEffect(() => {
    const a = getActive();
    if (!a || !current) return;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, current?.id]);

  // Bind listeners once per element. We attach to BOTH so that when active swaps, the wiring still works.
  useEffect(() => {
    const handlers: Array<() => void> = [];
    [aRef.current, bRef.current].forEach((el) => {
      if (!el) return;

      const onTime = () => {
        if (el !== getActive()) return;
        const t = el.currentTime;
        setPosition(t);

        // Replay heat — accumulate listening seconds (~1s ticks)
        if (current && isPlaying) {
          const now = performance.now();
          if (lastTickRef.current === 0) lastTickRef.current = now;
          const dt = (now - lastTickRef.current) / 1000;
          if (dt >= 1) {
            tickReplay(current.id, t, Math.min(dt, 2));
            lastTickRef.current = now;
          }
        }

        // A-B loop
        if (loop && t >= loop.end) {
          el.currentTime = loop.start;
        }

        // Crossfade trigger: when remaining < crossfadeSec, start fade to next
        const xf = useSettings.getState().crossfadeSec;
        if (xf > 0 && el.duration && !loop) {
          const remain = el.duration - t;
          if (remain <= xf && remain > 0.05 && !fadeRafRef.current) {
            startCrossfade(remain);
          }
        }
      };

      const onLoaded = () => {
        if (el === getActive()) setDuration(el.duration || 0);
      };
      const onEnded = () => {
        if (el !== getActive()) return;
        // If a crossfade is running, the swap will handle "next"
        if (fadeRafRef.current) return;
        next();
      };

      el.addEventListener("timeupdate", onTime);
      el.addEventListener("loadedmetadata", onLoaded);
      el.addEventListener("ended", onEnded);
      handlers.push(() => {
        el.removeEventListener("timeupdate", onTime);
        el.removeEventListener("loadedmetadata", onLoaded);
        el.removeEventListener("ended", onEnded);
      });
    });
    return () => handlers.forEach((h) => h());
  }, [loop?.start, loop?.end, next, current?.id, isPlaying, setDuration, setPosition, tickReplay]);

  // Reset tick baseline when play state or song changes
  useEffect(() => {
    lastTickRef.current = 0;
  }, [current?.id, isPlaying]);

  // Crossfade helper: ramps active down + inactive (next song) up over `seconds`.
  function startCrossfade(seconds: number) {
    const out = getActive();
    const inEl = getInactive();
    if (!out || !inEl) return;
    const { queue, currentId, repeat, shuffle } = usePlayer.getState();
    if (!currentId) return;

    // Decide next song id (mirror playerStore.next logic — but DON'T advance state yet)
    let nextId: string | null = null;
    if (repeat === "one") nextId = currentId;
    else {
      const idx = queue.indexOf(currentId);
      let nIdx = shuffle ? Math.floor(Math.random() * queue.length) : idx + 1;
      if (nIdx >= queue.length) nextId = repeat === "all" ? queue[0] : null;
      else nextId = queue[nIdx];
    }
    if (!nextId) return;

    const songs = usePlayer.getState().songs;
    const nextSong = songs.find((s) => s.id === nextId);
    if (!nextSong) return;

    // Prep inactive element with next track and start it silently
    inEl.src = nextSong.src;
    inEl.volume = 0;
    inEl.currentTime = 0;
    inEl.play().catch(() => {});

    const startVol = out.volume;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const k = Math.min(1, elapsed / seconds);
      out.volume = Math.max(0, startVol * (1 - k));
      inEl.volume = Math.min(1, k);
      if (k < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
      } else {
        // Swap: inactive becomes active
        out.pause();
        out.volume = 1;
        activeRef.current = activeRef.current === "a" ? "b" : "a";
        fadeRafRef.current = null;
        // Update store: set currentId to nextId, mark as playing
        usePlayer.setState({
          currentId: nextId,
          isPlaying: true,
          position: 0,
          loop: null,
          recents: [nextId!, ...usePlayer.getState().recents.filter((x) => x !== nextId)].slice(0, 20),
        });
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  }

  // ===== Media Session =====
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.singer || "Dude Nation",
        album: current.movie,
        artwork: current.poster
          ? [
              { src: current.poster, sizes: "256x256", type: "image/jpeg" },
              { src: current.poster, sizes: "512x512", type: "image/jpeg" },
            ]
          : [],
      });
    } catch { /* MediaMetadata may not exist on some browsers */ }

    const map: Array<[MediaSessionAction, () => void]> = [
      ["play", () => usePlayer.getState().setIsPlaying(true)],
      ["pause", () => usePlayer.getState().setIsPlaying(false)],
      ["nexttrack", () => usePlayer.getState().next()],
      ["previoustrack", () => usePlayer.getState().prev()],
      ["seekto", () => { /* set below with details */ }],
    ];
    map.forEach(([action]) => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    });
    try { navigator.mediaSession.setActionHandler("play", () => usePlayer.getState().setIsPlaying(true)); } catch {}
    try { navigator.mediaSession.setActionHandler("pause", () => usePlayer.getState().setIsPlaying(false)); } catch {}
    try { navigator.mediaSession.setActionHandler("nexttrack", () => usePlayer.getState().next()); } catch {}
    try { navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().prev()); } catch {}
    try {
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (typeof d.seekTime === "number") {
          const a = getActive();
          if (a) a.currentTime = d.seekTime;
        }
      });
    } catch {}
  }, [current?.id]);

  // Update media session position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    const a = getActive();
    if (!a || !current) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: a.duration || 0,
        position: a.currentTime || 0,
        playbackRate: 1,
      });
    } catch {}
  }, [current?.id]);

  // ===== Sleep timer =====
  useEffect(() => {
    const interval = setInterval(() => {
      const { mode, endsAt, cancel } = useSleepTimer.getState();
      if (mode === "duration" && endsAt && Date.now() >= endsAt) {
        usePlayer.getState().setIsPlaying(false);
        cancel();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // End-of-song timer: when a song ends naturally, if mode === "endOfSong", stop.
  useEffect(() => {
    const handleEnd = () => {
      const { mode, cancel } = useSleepTimer.getState();
      if (mode === "endOfSong") {
        usePlayer.getState().setIsPlaying(false);
        cancel();
      }
    };
    const a = aRef.current;
    const b = bRef.current;
    a?.addEventListener("ended", handleEnd);
    b?.addEventListener("ended", handleEnd);
    return () => {
      a?.removeEventListener("ended", handleEnd);
      b?.removeEventListener("ended", handleEnd);
    };
  }, []);

  return (
    <>
      <audio ref={aRef} preload="metadata" hidden />
      <audio ref={bRef} preload="metadata" hidden />
    </>
  );
}

/** Imperative seek helper (kept for back-compat) */
export function seekAudio(time: number) {
  const a = document.querySelector("audio");
  if (a) a.currentTime = Math.max(0, time);
}
