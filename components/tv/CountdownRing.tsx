"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  /** Epoch ms when the product leaves the screen. */
  deadline: number;
  /** Full countdown length (for computing how full the ring starts). */
  durationMs: number;
  size?: number;
}

const RADIUS = 88;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEWBOX = (RADIUS + STROKE) * 2;

/**
 * Glowing SVG ring that drains from full to empty.
 * Re-mount it with `key={deadline}` to restart on every scan (even the same code).
 */
export function CountdownRing({ deadline, durationMs, size = 200 }: Props) {
  // Snapshot once on mount so the ring animation is never re-targeted by re-renders.
  const [start] = useState(() => {
    const remaining = Math.max(0, deadline - Date.now());
    return { remaining, elapsedFraction: 1 - remaining / durationMs };
  });
  const [seconds, setSeconds] = useState(() => Math.ceil(start.remaining / 1000));

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [deadline]);

  const urgent = seconds <= 5;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-glow"
        aria-hidden
      >
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(220,20,60,.16)"
          strokeWidth={STROKE}
        />
        {/* Tick marks every 1/30th of the ring */}
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS - 16}
          fill="none"
          stroke="rgba(220,20,60,.35)"
          strokeWidth={6}
          strokeDasharray={`2 ${(2 * Math.PI * (RADIUS - 16)) / 30 - 2}`}
        />
        <motion.circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          stroke={urgent ? "#FF2400" : "#DC143C"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE * start.elapsedFraction }}
          animate={{ strokeDashoffset: CIRCUMFERENCE }}
          // Linear on purpose: a countdown must drain at constant speed or it
          // stops being an honest clock.
          transition={{ duration: start.remaining / 1000, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={seconds <= 5 ? seconds : "steady"}
          className={`font-display text-6xl font-black tabular-nums ${urgent ? "text-scarlet-400" : "text-white"} neon-text-soft`}
          // In the last 5 s each number "punches" in — a quick overshoot scale
          // draws the eye without moving layout.
          initial={urgent ? { scale: 1.35, opacity: 0.4 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          {seconds}
        </motion.span>
        <span className="font-hud text-sm font-semibold tracking-[0.35em] text-graphite-300">SEC</span>
      </div>
    </div>
  );
}
