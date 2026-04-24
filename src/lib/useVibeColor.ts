import { useEffect } from "react";
import { selectCurrent, usePlayer } from "./playerStore";

/** Repaints --vibe / --vibe-2 CSS vars when current song changes. */
export function useVibeColor() {
  const current = usePlayer(selectCurrent);
  useEffect(() => {
    const root = document.documentElement;
    const [h1, h2] = current?.vibe ?? [258, 172];
    root.style.setProperty("--vibe", `${h1} 90% 66%`);
    root.style.setProperty("--vibe-2", `${h2} 76% 50%`);
  }, [current?.id]);
}
