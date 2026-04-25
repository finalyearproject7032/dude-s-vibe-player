import type { Song, Mood } from "./types";

export type MoodMix = {
  id: string;
  title: string;
  blurb: string;
  hues: [number, number];
  pick: (songs: Song[]) => Song[];
};

export const MOOD_MIXES: MoodMix[] = [
  {
    id: "theatre-mass",
    title: "Theatre Mass",
    blurb: "Whistles, claps, fan-army energy.",
    hues: [12, 280],
    pick: (s) => s.filter((x) => x.mood === "Mass" || x.mood === "Hype"),
  },
  {
    id: "late-night-loop",
    title: "Late Night Loop",
    blurb: "One earphone, headlights blur, repeat one.",
    hues: [258, 220],
    pick: (s) => s.filter((x) => x.mood === "Melody" || x.mood === "BGM"),
  },
  {
    id: "heartbreak-hugs",
    title: "Heartbreak Hugs",
    blurb: "When the Dude songs hug back.",
    hues: [220, 290],
    pick: (s) => s.filter((x) => x.mood === "Emotional"),
  },
  {
    id: "telugu-only",
    title: "Telugu Drops",
    blurb: "Pure తెలుగు Dude bangers.",
    hues: [340, 30],
    pick: (s) => s.filter((x) => x.language === "Telugu"),
  },
  {
    id: "tamil-only",
    title: "Tamil Drops",
    blurb: "Sai-coded தமிழ் selection.",
    hues: [190, 280],
    pick: (s) => s.filter((x) => x.language === "Tamil"),
  },
  {
    id: "bro-tier-only",
    title: "Bro Tier Vault",
    blurb: "Only what survived the heart test.",
    hues: [320, 220],
    pick: (s) => s, // resolved by view using `liked`
  },
];

export const moodLabel: Record<Mood, string> = {
  Hype: "Hype",
  Mass: "Mass",
  Melody: "Melody",
  Emotional: "Emotional",
  BGM: "BGM",
};
