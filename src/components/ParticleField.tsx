import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
  count?: number;
  hue?: number;
  className?: string;
};

/** Lightweight canvas particle visualizer that pulses while playing. */
export function ParticleField({ active, count = 180, hue = 258, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>();

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr;
      c.height = r.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number };
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4 * dpr,
      vy: (Math.random() - 0.5) * 0.4 * dpr,
      r: (Math.random() * 1.6 + 0.4) * dpr,
      life: Math.random(),
    }));

    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, c.width, c.height);
      const beat = active ? 0.6 + Math.sin(t * 6) * 0.4 : 0.18;
      for (const p of particles) {
        p.x += p.vx * (active ? 1.6 : 0.6);
        p.y += p.vy * (active ? 1.6 : 0.6);
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        const a = (0.25 + p.life * 0.7) * beat;
        ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (active ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fill();
        p.life += 0.005;
        if (p.life > 1) p.life = 0;
      }
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [active, count, hue]);

  return <canvas ref={ref} className={className} />;
}
