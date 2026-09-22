"use client";

import { motion } from "framer-motion";
import { useMemo, type CSSProperties } from "react";

const MAX_PARTICLES = 60;

/** Tiny deterministic PRNG so SSR and client render identical particle layouts. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FieldProps {
  count?: number;
  seed?: number;
  className?: string;
}

/**
 * Ambient floating embers for the standby screen.
 * Driven entirely by a CSS keyframe (transform + opacity only), so after the
 * first paint it costs zero JavaScript per frame — important for 8 h uptime.
 */
export function ParticleField({ count = 44, seed = 1337, className = "" }: FieldProps) {
  const particles = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: Math.min(count, MAX_PARTICLES) }, (_, i) => {
      const size = 1.5 + rand() * 4.5;
      const hot = rand() > 0.78;
      return {
        id: i,
        size,
        hot,
        style: {
          left: `${rand() * 100}%`,
          top: `${45 + rand() * 65}%`,
          width: size,
          height: size,
          background: hot ? "#FF2400" : "#DC143C",
          boxShadow: `0 0 ${size * 3}px ${hot ? "rgba(255,36,0,.9)" : "rgba(220,20,60,.7)"}`,
          "--p-duration": `${10 + rand() * 16}s`,
          // Negative delays spread particles through their cycle from frame one.
          "--p-delay": `${-rand() * 26}s`,
          "--p-dx": `${(rand() - 0.5) * 220}px`,
          "--p-dy": `${-(380 + rand() * 720)}px`,
          "--p-opacity": `${0.25 + rand() * 0.65}`,
        } as CSSProperties,
      };
    });
  }, [count, seed]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p) => (
        <span key={p.id} className="absolute animate-particle-drift rounded-full" style={p.style} />
      ))}
    </div>
  );
}

interface BurstProps {
  count?: number;
  seed?: number;
  /** Seconds before the burst fires (lets the grid wipe land first). */
  delay?: number;
  originX?: number;
  originY?: number;
}

/**
 * One-shot radial particle burst for the scan transition.
 * Each particle only animates x / y / scale / opacity (compositor-only).
 */
export function ParticleBurst({ count = 48, seed = 99, delay = 0.18, originX = 960, originY = 540 }: BurstProps) {
  const particles = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: Math.min(count, MAX_PARTICLES) }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.4;
      const distance = 260 + rand() * 620;
      const size = 3 + rand() * 7;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance * 0.7,
        size,
        long: rand() > 0.6,
        rotate: (angle * 180) / Math.PI,
      };
    });
  }, [count, seed]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-scarlet-500"
          style={{
            left: originX,
            top: originY,
            width: p.long ? p.size * 4 : p.size,
            height: p.size,
            rotate: p.rotate,
            boxShadow: "0 0 12px rgba(255,36,0,.9)",
          }}
          initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          // Strong ease-out (expo-like curve): particles explode fast, then
          // decelerate and fade — reads as energy "dissolving" into the layout.
          transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
