import { useRef, useState } from "react";
import { usePlayer } from "@/lib/playerStore";
import { Music, Image as ImageIcon, Play, Pause } from "lucide-react";
import type { Lang, Mood } from "@/lib/types";
import { toast } from "sonner";

const MOODS: Mood[] = ["Hype", "Mass", "Melody", "Emotional", "BGM"];

export function AddSongView({ onAdded }: { onAdded: () => void }) {
  const addUserSong = usePlayer((s) => s.addUserSong);
  const [title, setTitle] = useState("");
  const [movie, setMovie] = useState("");
  const [singer, setSinger] = useState("");
  const [language, setLanguage] = useState<Lang>("Tamil");
  const [mood, setMood] = useState<Mood>("Hype");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const readAsDataURL = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const onAudio = async (f: File | null) => {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) {
      toast.error("Audio over 25MB — pick a smaller file so it stays saved.");
      return;
    }
    try {
      const dataUrl = await readAsDataURL(f);
      setAudioUrl(dataUrl);
      setAudioName(f.name);
      if (!title) setTitle(f.name.replace(/\.(mp3|m4a|wav|aac)$/i, "").replace(/[_-]/g, " "));
    } catch {
      toast.error("Couldn't read that audio file.");
    }
  };
  const onPoster = async (f: File | null) => {
    if (!f) return;
    try {
      const dataUrl = await readAsDataURL(f);
      setPoster(dataUrl);
    } catch {
      toast.error("Couldn't read that image.");
    }
  };

  const togglePreview = () => {
    const a = previewRef.current;
    if (!a) return;
    if (previewing) { a.pause(); setPreviewing(false); }
    else { a.play(); setPreviewing(true); }
  };

  const submit = () => {
    if (!audioUrl) { toast.error("Drop an MP3 first."); return; }
    if (!title.trim() || !movie.trim()) { toast.error("Song & movie name required."); return; }
    addUserSong({
      title: title.trim(),
      movie: movie.trim(),
      singer: singer.trim() || undefined,
      language,
      mood,
      src: audioUrl,
      poster: poster ?? undefined,
    });
    toast.success("Dropped into Dudify. Bro Tier eligible.");
    onAdded();
  };

  return (
    <div className="space-y-4 pb-32 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold">Add Song</h1>
        <p className="text-sm text-muted-foreground">Feed the beast. Only Dude bangers go in here.</p>
      </header>

      <label className="glass-strong rounded-2xl p-4 flex items-center gap-3 cursor-pointer pressable">
        <div className="grid place-items-center h-12 w-12 rounded-xl" style={{ background: "var(--gradient-vibe)" }}>
          <Music className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{audioName || "Choose audio (.mp3 / .m4a)"}</div>
          <div className="text-xs text-muted-foreground">Stored locally on your device.</div>
        </div>
        {audioUrl && (
          <button onClick={(e) => { e.preventDefault(); togglePreview(); }} className="p-2 rounded-full glass pressable">
            {previewing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        )}
        <input type="file" accept="audio/*" hidden onChange={(e) => onAudio(e.target.files?.[0] ?? null)} />
      </label>
      {audioUrl && (
        <audio ref={previewRef} src={audioUrl} onEnded={() => setPreviewing(false)} hidden />
      )}

      <label className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer pressable">
        <div className="grid place-items-center h-12 w-12 rounded-xl bg-foreground/10 overflow-hidden">
          {poster ? <img src={poster} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="text-sm font-semibold flex-1">{poster ? "Poster ready" : "Add movie poster"}</div>
        <input type="file" accept="image/*" hidden onChange={(e) => onPoster(e.target.files?.[0] ?? null)} />
      </label>

      <Field label="Song Name" value={title} onChange={setTitle} />
      <Field label="Movie Name" value={movie} onChange={setMovie} />
      <Field label="Singer (optional)" value={singer} onChange={setSinger} />

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Language</div>
        <div className="flex gap-2">
          {(["Telugu", "Tamil"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-4 py-2 rounded-full text-sm font-semibold pressable border ${
                language === l ? "border-transparent text-primary-foreground" : "border-border text-foreground/80"
              }`}
              style={language === l ? { background: "var(--gradient-vibe)" } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Mood</div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold pressable border ${
                mood === m ? "border-vibe text-vibe bg-vibe/10" : "border-border text-foreground/70"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        className="w-full rounded-2xl py-4 font-display font-bold text-primary-foreground pressable vibe-glow"
        style={{ background: "var(--gradient-vibe)" }}
      >
        Drop It Into Dudify
      </button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass-strong rounded-2xl px-4 py-3 text-sm outline-none focus:border-vibe"
      />
    </label>
  );
}
