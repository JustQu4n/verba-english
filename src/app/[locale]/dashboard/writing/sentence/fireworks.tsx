"use client";

import { useEffect, useRef } from "react";

/** `pair` is the long show for finishing a whole category; `short` is the quick one for a single sentence. */
const SHOWS = {
  pair: { duration: 6000, burstEvery: 450, stopBurstsBefore: 1500, particles: 70, fade: 0.012, top: 0.12, spread: 0.4 },
  short: { duration: 1700, burstEvery: 260, stopBurstsBefore: 700, particles: 42, fade: 0.022, top: 0.1, spread: 0.3 },
} as const;
export type FireworksVariant = keyof typeof SHOWS;

const GRAVITY = 0.06;
// Dark tones on the light page, light tones on the dark page.
const DARK_TONES = ["#000000", "#262626", "#525252", "#737373", "#a3a3a3"];
const LIGHT_TONES = ["#ffffff", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  tone: string;
  size: number;
}

function burst(width: number, height: number, show: (typeof SHOWS)[FireworksVariant]): Particle[] {
  const x = width * (0.15 + Math.random() * 0.7);
  const y = height * (show.top + Math.random() * show.spread);
  const tones = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark" ? LIGHT_TONES : DARK_TONES;
  const tone = tones[Math.floor(Math.random() * tones.length)] ?? "#808080";
  return Array.from({ length: show.particles }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.5;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, tone, size: 1.5 + Math.random() * 2 };
  });
}

/**
 * Full-screen fireworks that play once for a few seconds (or about two for the short show) and then stop drawing.
 * Decorative only: it ignores pointer events and is skipped for people who prefer reduced motion.
 */
export function Fireworks({ variant = "pair" }: { variant?: FireworksVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ratio = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const show = SHOWS[variant];
    let particles: Particle[] = [];
    const start = performance.now();
    let lastBurst = -show.burstEvery;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < show.duration - show.stopBurstsBefore && elapsed - lastBurst >= show.burstEvery) {
        lastBurst = elapsed;
        particles = particles.concat(burst(window.innerWidth, window.innerHeight, show));
      }
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= show.fade;
        context.globalAlpha = Math.max(p.life, 0);
        context.fillStyle = p.tone;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      if (elapsed < show.duration || particles.length > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden="true" data-testid="fireworks" className="pointer-events-none fixed inset-0 z-50 size-full" />;
}
