"use client";

import { motion } from "framer-motion";
import { ParticleBurst } from "./ParticleField";

interface Props {
  code: string;
}

// Cubic-bezier "expo out": very fast start, soft landing. Makes a 250 ms wipe
// feel like a hard digital snap rather than a slide.
const SNAP = [0.16, 1, 0.3, 1] as const;

/**
 * ~650 ms scan transition:
 *   0–260 ms  red grid wipes in left→right (clip-path) + bright scan bar sweeps
 *   180 ms    particle burst from centre
 *   150–500   "SCAN ACQUIRED" + code flash
 *   exit      grid collapses to the right while the product layout fades in beneath
 */
export function ScanTransition({ code }: Props) {
  return (
    <motion.section
      className="absolute inset-0 z-20 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      {/* Dark veil so the outgoing screen is "switched off" behind the wipe */}
      <motion.div
        className="absolute inset-0 bg-void"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.92 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />

      {/* Red digital grid wipe (clip-path only, no layout) */}
      <motion.div
        className="absolute inset-0 bg-hud-grid-strong bg-grid"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        exit={{ clipPath: "inset(0 0 0 100%)", transition: { duration: 0.25, ease: [0.7, 0, 0.84, 0] } }}
        transition={{ duration: 0.26, ease: SNAP }}
      />

      {/* Horizontal interference bands */}
      {[180, 420, 610, 860].map((top, i) => (
        <motion.div
          key={top}
          className="absolute inset-x-0 h-[3px] origin-left bg-scarlet-500 shadow-glow"
          style={{ top }}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          // Staggered by 40 ms each so the bands "tear" across in sequence.
          transition={{ duration: 0.34, delay: 0.04 * i, ease: SNAP }}
        />
      ))}

      {/* Bright vertical scan bar sweeping the width of the canvas */}
      <motion.div
        className="absolute inset-y-0 left-0 w-[140px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,36,0,.25) 40%, rgba(255,255,255,.95) 50%, rgba(255,36,0,.25) 60%, transparent)",
        }}
        initial={{ x: -160 }}
        animate={{ x: 1940 }}
        transition={{ duration: 0.36, ease: [0.45, 0, 0.2, 1] }}
      />

      <ParticleBurst delay={0.18} />

      {/* Centre lock-on readout */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [1.3, 1, 1, 0.94] }}
        // Keyframe times: punch in by 30 %, hold, fade out at the tail so the
        // readout is gone before the product text starts staggering in.
        transition={{ duration: 0.6, times: [0, 0.3, 0.75, 1], ease: "easeOut" }}
      >
        <div className="flex h-40 w-40 items-center justify-center border-2 border-scarlet-500 shadow-glow-lg">
          <div className="h-16 w-16 animate-pulse-dot rounded-full bg-scarlet-500 shadow-glow-lg" />
        </div>
        <span className="neon-text font-display text-6xl font-black tracking-[0.3em]">SCAN ACQUIRED</span>
        <span className="font-hud text-3xl font-semibold tracking-[0.5em] text-crimson-200">{code}</span>
      </motion.div>

      {/* Full-screen flash at the moment of impact */}
      <motion.div
        className="absolute inset-0 bg-scarlet-500 mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 0.3, delay: 0.12, times: [0, 0.3, 1] }}
      />
    </motion.section>
  );
}
