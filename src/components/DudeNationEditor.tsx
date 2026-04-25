import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ImagePlus, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useDudeNation } from "@/lib/dudeNationStore";
import { toast } from "sonner";

const readAsDataURL = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

type Props = {
  trigger?: React.ReactNode;
};

export function DudeNationEditor({ trigger }: Props) {
  const quotes = useDudeNation((s) => s.quotes);
  const update = useDudeNation((s) => s.update);
  const add = useDudeNation((s) => s.add);
  const remove = useDudeNation((s) => s.remove);
  const reset = useDudeNation((s) => s.reset);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            className="text-xs text-muted-foreground hover:text-vibe inline-flex items-center gap-1 pressable"
            aria-label="Edit Dude Nation quotes"
          >
            <Pencil className="h-3 w-3" />
            edit
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background/95 backdrop-blur">
        <SheetHeader>
          <SheetTitle className="font-display">Dude Nation — Quotes</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex gap-2">
          <Button onClick={add} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add quote
          </Button>
          <Button onClick={reset} size="sm" variant="outline" className="gap-1">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="mt-5 space-y-5 pb-12">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-border p-4 space-y-3 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, hsl(${q.h1} 70% 20% / 0.35), hsl(${q.h2} 65% 12% / 0.35))`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/70">
                  {q.tag || "Tag"}
                </span>
                <button
                  onClick={() => remove(q.id)}
                  className="text-muted-foreground hover:text-destructive p-1 pressable"
                  aria-label="Delete quote"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`text-${q.id}`} className="text-xs">Quote</Label>
                <Textarea
                  id={`text-${q.id}`}
                  value={q.text}
                  onChange={(e) => update(q.id, { text: e.target.value })}
                  rows={2}
                  className="bg-background/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`author-${q.id}`} className="text-xs">Author</Label>
                  <Input
                    id={`author-${q.id}`}
                    value={q.author}
                    onChange={(e) => update(q.id, { author: e.target.value })}
                    className="bg-background/60"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tag-${q.id}`} className="text-xs">Tag</Label>
                  <Input
                    id={`tag-${q.id}`}
                    value={q.tag}
                    onChange={(e) => update(q.id, { tag: e.target.value })}
                    className="bg-background/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Hue 1 · {q.h1}°</Label>
                  <Slider
                    value={[q.h1]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([v]) => update(q.id, { h1: v })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hue 2 · {q.h2}°</Label>
                  <Slider
                    value={[q.h2]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([v]) => update(q.id, { h2: v })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Background image (optional)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 cursor-pointer pressable text-xs">
                    <ImagePlus className="h-4 w-4" />
                    <span className="truncate">{q.poster ? "Replace image" : "Upload image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error("Image > 5MB."); return; }
                        try {
                          const url = await readAsDataURL(f);
                          update(q.id, { poster: url });
                        } catch { toast.error("Couldn't read image."); }
                      }}
                    />
                  </label>
                  {q.poster && (
                    <button
                      onClick={() => update(q.id, { poster: undefined })}
                      className="p-2 rounded-lg border border-border pressable"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {q.poster && (
                  <img src={q.poster} alt="" className="mt-2 h-20 w-full object-cover rounded-lg" />
                )}
              </div>
            </div>
          ))}

          {quotes.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              No quotes yet. Add one to start the Dude Nation.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
