type Props = { active?: boolean; className?: string };
export function Equalizer({ active = true, className = "" }: Props) {
  return (
    <div className={`flex items-end gap-[3px] h-4 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="equalizer-bar"
          style={{
            animationPlayState: active ? "running" : "paused",
            animationDelay: `${i * 0.15}s`,
            background: "hsl(var(--vibe))",
            boxShadow: "0 0 6px hsl(var(--vibe) / 0.8)",
          }}
        />
      ))}
    </div>
  );
}
