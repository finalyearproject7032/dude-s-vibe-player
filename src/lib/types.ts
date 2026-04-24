export type Lang = "Telugu" | "Tamil";
export type Mood = "Hype" | "Mass" | "Melody" | "Emotional" | "BGM";

export type Song = {
  id: string;
  title: string;
  movie: string;
  language: Lang;
  mood: Mood;
  singer?: string;
  src: string;          // audio URL or blob: URL
  poster?: string;      // optional image URL
  /** Two HSL hue numbers for vibe gradient */
  vibe: [number, number];
  /** Cinematic side-quote shown on Now Playing */
  quote: string;
  builtIn?: boolean;
};

export type VibeMoment = {
  id: string;
  songId: string;
  time: number;        // seconds
  label?: string;
  createdAt: number;
};

export type Loop = { start: number; end: number } | null;
