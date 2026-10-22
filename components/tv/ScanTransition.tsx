"use client";

import { motion } from "framer-motion";
import { ParticleBurst } from "./ParticleField";

interface Props {
  code: string;
}

// Cubic-bezier "expo out": very fast start, soft landing. A 300 ms ribbon
// sweep feels like a confident swish rather than a slow slide.
const SWISH = [0.16, 1, 0.3, 1] as const;
// Accelerating curve for the exit, so the ribbons "fly off" rather than fade.
const FLY_OFF = [0.7, 0, 0.84, 0] as const;

/** A wide flowing ribbon band, drawn across the full 1920 × 1080 canvas. */
function RibbonBand({ d, fill, delay, opacity = 1 }: { d: string; fill: string; delay: number; opacity?: number }) {
  return (
    <motion.svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 h-full w-full"
      style={{ opacity }}
      // Wipe in left → right with clip-path, then out to the right on exit.
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      exit={{ clipPath: "inset(0 0 0 100%)", transition: { duration: 0.28, ease: FLY_OFF } }}
      transition={{ duration: 0.32, delay, ease: SWISH }}
      aria-hidden
    >
      <path d={d} fill={fill} />
    </motion.svg>
  );
}

/**
 * ~650 ms scan transition:
 *   0–180 ms   warm white veil rises over the outgoing screen
 *   0–380 ms   three ribbons (red, gold, cream) swish across, staggered 50 ms
 *   180 ms     gold / red particle burst from the centre
 *   120–600    lock-on ring + "SCAN ACQUIRED" + barcode
 *   exit       ribbons fly off to the right while the product fades in beneath
 */
export function ScanTransition({ code }: Props) {
  return (
    <motion.section
      className="absolute inset-0 z-20 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05, ease: "easeOut" } }}
    >
      <svg width={0} height={0} className="absolute" aria-hidden>
        <defs>
          <linearGradient id="swish-red" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0" stopColor="#960018" />
            <stop offset="0.45" stopColor="#CC122A" />
            <stop offset="0.75" stopColor="#E3263A" />
            <stop offset="1" stopColor="#B40C24" />
          </linearGradient>
        </defs>
      </svg>

      {/* Warm veil so the outgoing screen softly "dims to light" behind the ribbons */}
      <motion.div
        className="absolute inset-0 bg-sunrise"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.94 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />

      {/* Ribbons: diagonal S-curves crossing the canvas */}
      <RibbonBand
        d="M-40,760 C420,560 900,980 1960,520 L1960,700 C900,1120 420,720 -40,940 Z"
        fill="url(#swish-red)"
        delay={0}
      />
      <RibbonBand d="M-40,700 C420,500 900,920 1960,460 L1960,500 C900,960 420,540 -40,742 Z" fill="#F7C88A" delay={0.05} />
      <RibbonBand
        d="M-40,250 C520,90 1100,470 1960,170 L1960,240 C1100,540 520,160 -40,320 Z"
        fill="#E5707F"
        delay={0.1}
        opacity={0.55}
      />

      {/* Bright light sweep */}
      <motion.div
        className="absolute inset-y-0 left-0 w-[220px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(252,222,180,.45) 35%, rgba(255,255,255,.95) 50%, rgba(252,222,180,.45) 65%, transparent)",
        }}
        initial={{ x: -240 }}
        animate={{ x: 1960 }}
        transition={{ duration: 0.4, ease: [0.45, 0, 0.2, 1] }}
      />

      <ParticleBurst delay={0.18} />

      {/* Centre lock-on readout */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        initial={{ opacity: 0, scale: 1.25 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [1.25, 1, 1, 0.95] }}
        // Keyframe times: punch in by 30 %, hold, fade at the tail so the readout
        // is gone before the product text starts staggering in.
        transition={{ duration: 0.6, times: [0, 0.3, 0.75, 1], ease: "easeOut" }}
      >
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-glow-lg">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <motion.circle
              cx={50}
              cy={50}
              r={44}
              fill="none"
              stroke="#CC122A"
              strokeWidth={6}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: SWISH }}
            />
          </svg>
          <motion.svg
            viewBox="0 0 24 24"
            className="h-16 w-16"
            fill="none"
            stroke="#CC122A"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
            />
          </motion.svg>
        </div>
        <span className="rounded-full bg-white/90 px-10 py-3 text-6xl font-extrabold tracking-[0.12em] text-ink shadow-glow-inset">
          SCAN <span className="brand-text">ACQUIRED</span>
        </span>
        <span className="text-3xl font-semibold tracking-[0.35em] text-crimson-600">{code}</span>
      </motion.div>

      {/* Soft white flash at the moment of impact */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.3, delay: 0.12, times: [0, 0.3, 1] }}
      />
    </motion.section>
  );
}
