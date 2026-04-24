import { useEffect, useRef } from "react";
import { selectCurrent, usePlayer } from "./playerStore";

/**
 * Mounts a single <audio> element and wires it to the zustand store.
 * Renders a hidden audio tag; controlled imperatively.
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const current = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const loop = usePlayer((s) => s.loop);
  const setPosition = usePlayer((s) => s.setPosition);
  const setDuration = usePlayer((s) => s.setDuration);
  const setIsPlaying = usePlayer((s) => s.setIsPlaying);
  const next = usePlayer((s) => s.next);

  // Load when src changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) { a.pause(); a.removeAttribute("src"); a.load(); return; }
    if (a.src !== window.location.origin + current.src && a.src !== current.src) {
      a.src = current.src;
      a.load();
    }
  }, [current?.id, current?.src]);

  // Play / pause
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, current?.id]);

  // A-B loop enforcement
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setPosition(a.currentTime);
      if (loop && a.currentTime >= loop.end) {
        a.currentTime = loop.start;
      }
    };
    const onLoaded = () => setDuration(a.duration || 0);
    const onEnded = () => next();
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnded);
    };
  }, [loop?.start, loop?.end, next, setDuration, setPosition]);

  return <audio ref={audioRef} preload="metadata" hidden />;
}

/** Imperative seek helper */
export function seekAudio(time: number) {
  const a = document.querySelector("audio");
  if (a) a.currentTime = Math.max(0, time);
}
