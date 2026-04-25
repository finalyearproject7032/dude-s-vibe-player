import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Moon, X } from "lucide-react";
import { useSleepTimer } from "@/lib/sleepTimerStore";
import { toast } from "sonner";

const PRESETS = [5, 15, 30, 45, 60];

export function SleepTimer({ trigger }: { trigger: React.ReactNode }) {
  const mode = useSleepTimer((s) => s.mode);
  const setEndOfSong = useSleepTimer((s) => s.setEndOfSong);
  const setDuration = useSleepTimer((s) => s.setDuration);
  const cancel = useSleepTimer((s) => s.cancel);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (mode !== "duration") return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [mode]);

  const left = useSleepTimer.getState().secondsLeft();
  const mm = left != null ? Math.floor(left / 60) : 0;
  const ss = left != null ? left % 60 : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="bg-background/95 backdrop-blur rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <Moon className="h-5 w-5 text-vibe" /> Sleep Timer
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-6">
          {mode && (
            <div className="glass-strong rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Active</div>
                <div className="font-display text-lg">
                  {mode === "endOfSong"
                    ? "Stop after this song"
                    : `${mm}:${ss.toString().padStart(2, "0")} left`}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { cancel(); toast("Sleep timer canceled."); }} className="gap-1">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          )}

          <Button
            onClick={() => { setEndOfSong(); toast("Stopping after this song. Sweet dreams, Dude."); }}
            className="w-full justify-start"
            variant={mode === "endOfSong" ? "default" : "outline"}
          >
            🎵 Stop after this song
          </Button>

          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((m) => (
              <Button
                key={m}
                variant="outline"
                onClick={() => { setDuration(m); toast(`Pausing in ${m} min.`); }}
              >
                {m} min
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            One earphone in. Dude'll handle the rest.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
