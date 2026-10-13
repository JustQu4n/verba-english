"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 6000;
const BURST_EVERY_MS = 450;
const PARTICLES_PER_BURST = 70;
const GRAVITY = 0.06;
const TONES = ["#000000", "#262626", "#525252", "#737373", "#a3a3a3"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  tone: string;
  size: number;
}

function burst(width: number, height: number): Particle[] {
  const x = width * (0.15 + Math.random() * 0.7);
  const y = height * (0.12 + Math.random() * 0.4);
  const tone = TONES[Math.floor(Math.random() * TONES.length)] ?? "#000000";
  return Array.from({ length: PARTICLES_PER_BURST }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.5;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, tone, size: 1.5 + Math.random() * 2 };
  });
}

/**
 * Full-screen fireworks that play once for a few seconds and then stop drawing.
 * Decorative only: it ignores pointer events and is skipped for people who prefer reduced motion.
 */
export function Fireworks() {
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

    let particles: Particle[] = [];
    const start = performance.now();
    let lastBurst = -BURST_EVERY_MS;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < DURATION_MS - 1500 && elapsed - lastBurst >= BURST_EVERY_MS) {
        lastBurst = elapsed;
        particles = particles.concat(burst(window.innerWidth, window.innerHeight));
      }
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.vy += GRAVITY;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        context.globalAlpha = Math.max(p.life, 0);
        context.fillStyle = p.tone;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      if (elapsed < DURATION_MS || particles.length > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" data-testid="fireworks" className="pointer-events-none fixed inset-0 z-50 size-full" />;
}
