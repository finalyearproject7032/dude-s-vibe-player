import { useState } from "react";
import { useDudeGallery } from "@/lib/dudeGalleryStore";
import { ImagePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function GalleryView() {
  const items = useDudeGallery((s) => s.items);
  const add = useDudeGallery((s) => s.add);
  const remove = useDudeGallery((s) => s.remove);
  const updateCaption = useDudeGallery((s) => s.updateCaption);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const readAsDataURL = (f: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    let added = 0;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name} > 8MB — skipped.`);
        continue;
      }
      try {
        const url = await readAsDataURL(f);
        add(url);
        added++;
      } catch {/* ignore */}
    }
    if (added) toast.success(`Added ${added} dude moment${added > 1 ? "s" : ""}.`);
  };

  return (
    <div className="space-y-4 pb-32 animate-fade-in">
      <header>
        <h1 className="font-display text-2xl font-bold">Dude Gallery</h1>
        <p className="text-sm text-muted-foreground">Your shrine of Dude movie moments. Saved on this device.</p>
      </header>

      <label className="glass-strong rounded-2xl p-4 flex items-center gap-3 cursor-pointer pressable">
        <div className="grid place-items-center h-12 w-12 rounded-xl" style={{ background: "var(--gradient-vibe)" }}>
          <ImagePlus className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Upload Dude pics</div>
          <div className="text-xs text-muted-foreground">JPG / PNG · multiple OK · max 8MB each</div>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="font-display text-lg">No dude vibes yet.</div>
          <div className="text-sm text-muted-foreground mt-1">Drop your first poster, BTS pic, or theatre selfie.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.id} className="group relative aspect-square rounded-2xl overflow-hidden glass-strong">
              <button
                onClick={() => setLightbox(it.src)}
                className="absolute inset-0"
                aria-label="View image"
              >
                <img src={it.src} alt={it.caption ?? "Dude moment"} className="h-full w-full object-cover" />
              </button>
              <button
                onClick={() => remove(it.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/70 backdrop-blur text-destructive opacity-0 group-hover:opacity-100 transition-opacity pressable"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <input
                value={it.caption ?? ""}
                onChange={(e) => updateCaption(it.id, e.target.value)}
                placeholder="caption…"
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent text-xs px-3 py-2 outline-none placeholder:text-foreground/50"
              />
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl grid place-items-center p-6 animate-fade-in"
        >
          <button className="absolute top-4 right-4 p-2 rounded-full glass" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
