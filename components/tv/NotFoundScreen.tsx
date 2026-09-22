"use client";

import { motion } from "framer-motion";
import { NOT_FOUND_MS } from "@/lib/config";

interface Props {
  code: string;
}

export function NotFoundScreen({ code }: Props) {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-void"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-hud-grid bg-grid opacity-60" />
      {/* Hazard stripes top & bottom */}
      {["top-0", "bottom-0"].map((pos) => (
        <div
          key={pos}
          className={`absolute inset-x-0 ${pos} h-10 opacity-70`}
          style={{
            background: "repeating-linear-gradient(-45deg, #DC143C 0 28px, transparent 28px 56px)",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-red-radial opacity-60" />
      <div className="absolute inset-0 bg-vignette" />

      <div className="relative flex h-full flex-col items-center justify-center gap-10 text-center">
        <motion.div
          className="font-hud text-3xl font-semibold tracking-[0.6em] text-scarlet-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        >
          ⚠ ERROR 404 · NO MATCH
        </motion.div>

        {/* Hard "glitch-in": quick horizontal jitter + skew over 350 ms using
            linear keyframes (glitches should look mechanical, not eased). */}
        <motion.h1
          className="glitch animate-flicker font-display text-[150px] font-black leading-none tracking-[0.06em] text-white neon-text"
          data-text="PRODUCT NOT FOUND"
          initial={{ x: -40, skewX: 20, opacity: 0 }}
          animate={{ x: [-40, 30, -18, 8, 0], skewX: [20, -14, 8, -3, 0], opacity: [0, 1, 0.6, 1, 1] }}
          transition={{ duration: 0.35, ease: "linear" }}
        >
          PRODUCT NOT FOUND
        </motion.h1>

        <div className="hud-panel px-12 py-6">
          <span className="font-hud text-2xl font-semibold tracking-[0.4em] text-graphite-300">
            SCANNED CODE: <span className="text-crimson-200">{code || "—"}</span>
          </span>
        </div>

        <p className="font-sans text-3xl font-light text-graphite-200">ไม่พบสินค้านี้ในระบบ กรุณาสแกนใหม่อีกครั้ง</p>

        <div className="mt-6 h-2 w-[640px] overflow-hidden bg-crimson-900/60">
          <motion.div
            className="h-full origin-left bg-scarlet-500 shadow-glow"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: NOT_FOUND_MS / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </motion.section>
  );
}
