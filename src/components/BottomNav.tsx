import { Home, Images, Library, Plus, Search } from "lucide-react";

export type Tab = "home" | "search" | "add" | "library" | "gallery";

type Props = { tab: Tab; onTab: (t: Tab) => void };

const items: { id: Tab; label: string; Icon: any }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "search", label: "Search", Icon: Search },
  { id: "add", label: "Add", Icon: Plus },
  { id: "library", label: "Library", Icon: Library },
  { id: "gallery", label: "Gallery", Icon: Images },
];

export function BottomNav({ tab, onTab }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
      <div className="mx-auto max-w-md px-2 pb-2">
        <div className="glass-strong rounded-2xl flex items-center justify-around py-1.5">
          {items.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => onTab(id)}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 pressable"
                aria-label={label}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${active ? "text-vibe" : "text-foreground/60"}`}
                  style={active ? { filter: "drop-shadow(0 0 8px hsl(var(--vibe)))" } : undefined}
                />
                <span className={`text-[10px] ${active ? "text-vibe" : "text-foreground/60"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
