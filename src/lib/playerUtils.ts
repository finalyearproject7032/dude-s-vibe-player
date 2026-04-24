import type { Song } from "./types";

export function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Deterministic pseudo-waveform peaks (0..1) seeded by song id */
export function fakeWaveform(seed: string, bars = 80): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const r = (h & 0xffff) / 0xffff;
    // shape: low edges, peaky middle
    const env = Math.sin((i / bars) * Math.PI);
    out.push(0.18 + r * 0.6 * env + Math.abs(Math.sin(i * 0.6)) * 0.15);
  }
  return out;
}

export function haptic(kind: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(kind === "light" ? 8 : kind === "medium" ? 18 : 35);
}

export function gradientFor(song?: Song | null) {
  const [h1, h2] = song?.vibe ?? [258, 172];
  return `linear-gradient(135deg, hsl(${h1} 90% 60%), hsl(${h2} 76% 45%))`;
}

export function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "late night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}
