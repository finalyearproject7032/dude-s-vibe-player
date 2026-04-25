import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Download, Upload } from "lucide-react";
import { useSettings } from "@/lib/settingsStore";
import { usePlayer } from "@/lib/playerStore";
import { useDudeNation } from "@/lib/dudeNationStore";
import { useDudeGallery } from "@/lib/dudeGalleryStore";
import { useLyrics } from "@/lib/lyricsStore";
import { useReplay } from "@/lib/replayStore";
import { toast } from "sonner";

export function SettingsSheet({ trigger }: { trigger?: React.ReactNode }) {
  const crossfade = useSettings((s) => s.crossfadeSec);
  const setCrossfade = useSettings((s) => s.setCrossfade);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const exportVault = () => {
    const player = usePlayer.getState();
    const dn = useDudeNation.getState();
    const gallery = useDudeGallery.getState();
    const lyrics = useLyrics.getState();
    const replay = useReplay.getState();

    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            // only user songs (built-ins live in code)
            userSongs: player.songs.filter((s) => !s.builtIn),
            liked: player.liked,
            moments: player.moments,
            recents: player.recents,
            dudeNation: dn.quotes,
            gallery: gallery.items,
            lyrics: lyrics.lyrics,
            replayHeat: replay.heat,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dudify-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Vault exported. Stash it somewhere safe.");
  };

  const importVault = async (f: File | null) => {
    if (!f) return;
    setBusy(true);
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.userSongs)) {
        const existing = usePlayer.getState().songs;
        const builtIns = existing.filter((s) => s.builtIn);
        const merged = [...builtIns, ...data.userSongs];
        usePlayer.setState({
          songs: merged,
          queue: merged.map((s) => s.id),
          liked: data.liked ?? [],
          moments: data.moments ?? [],
          recents: data.recents ?? [],
        });
      }
      if (Array.isArray(data.dudeNation)) useDudeNation.setState({ quotes: data.dudeNation });
      if (Array.isArray(data.gallery)) useDudeGallery.setState({ items: data.gallery });
      if (data.lyrics && typeof data.lyrics === "object") useLyrics.setState({ lyrics: data.lyrics });
      if (data.replayHeat && typeof data.replayHeat === "object") useReplay.setState({ heat: data.replayHeat });
      toast.success("Vault imported. Welcome home, Dude.");
    } catch (e) {
      toast.error("Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <button className="p-2 rounded-full glass pressable" aria-label="Settings">
            <SettingsIcon className="h-4 w-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background/95 backdrop-blur">
        <SheetHeader>
          <SheetTitle className="font-display">Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-6 pb-12">
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Crossfade</Label>
            <div className="text-sm">{crossfade === 0 ? "Off" : `${crossfade}s`}</div>
            <Slider
              value={[crossfade]}
              min={0}
              max={8}
              step={1}
              onValueChange={([v]) => setCrossfade(v)}
            />
            <p className="text-xs text-muted-foreground">
              Smoothly blend into the next song. Set to 0 for gapless / hard cuts.
            </p>
          </section>

          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Vault</Label>
            <p className="text-xs text-muted-foreground">
              Your songs, quotes, gallery, lyrics, and replay heat — all in one JSON.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={exportVault} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button
                onClick={() => fileInput.current?.click()}
                variant="outline"
                disabled={busy}
                className="gap-2"
              >
                <Upload className="h-4 w-4" /> Import
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => importVault(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          <section className="text-xs text-muted-foreground">
            <p>Dudify is local-first: nothing leaves your device unless you share it.</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
