"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/lib/types";
import { CountdownRing } from "./CountdownRing";

interface Props {
  product: Product;
  deadline: number;
  durationMs: number;
  /** Increments on a re-scan of the product already on screen. */
  rescanCount: number;
}

const screenVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: [0.4, 0, 1, 1] } },
};

// Parent orchestrates the text column. staggerChildren 0.12 s gives the eye
// time to register each line (label → title → description → price) as a
// separate beat, while the whole cascade still completes in < 1 s.
// delayChildren waits for the image spring to be mostly settled.
const textColumn: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.18 } },
};

// Each line fades up from below (opacity + y only) — expo-out so it
// arrives fast and "locks" into place, matching the HUD aesthetic.
const textItem: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// Divider draws from the left like a scanner trace.
const lineItem: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { scaleX: 1, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative flex h-[780px] w-[780px] items-center justify-center">
      {/* Glowing aura: radial gradient (no blur filter), only opacity/scale animate. */}
      <motion.div
        className="absolute inset-[-120px] rounded-full bg-red-radial"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0.65, 1, 0.65], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Rotating HUD ring behind the product */}
      <motion.div
        className="absolute inset-[10px] rounded-full border-2 border-dashed border-crimson-500/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[60px] rounded-full border border-scarlet-500/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      />

      {/* Entrance: spring 0.6 → 1. stiffness 170 / damping 16 gives one soft
          overshoot (~1.03) — a physical "landing" rather than a linear zoom. */}
      <motion.div
        className="relative"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 16, mass: 0.9 }}
      >
        {/* Idle hover loop on a separate element so it never fights the entrance spring.
            y ±12 px + ±1.5° over 3.2 s easeInOut with mirror repeat = smooth levitation. */}
        <motion.div
          className="hud-corners relative p-6"
          animate={{ y: [-12, 12], rotate: [-1.5, 1.5] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <div className="relative h-[600px] w-[600px] overflow-hidden bg-graphite-800 shadow-glow-lg">
            {product.image_url && !failed ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover"
                draggable={false}
                decoding="async"
                onError={() => setFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-hud-grid bg-grid">
                <span className="font-display text-8xl font-black text-crimson-500/60">
                  {product.title.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-60" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Step the title size down for long names so it fits the ~860 px column in ≤ 3 lines. */
function titleSize(title: string): number {
  if (title.length > 34) return 52;
  if (title.length > 22) return 62;
  if (title.length > 14) return 72;
  return 88;
}

export function ProductScreen({ product, deadline, durationMs, rescanCount }: Props) {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-void"
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {product.video_url ? (
        <video
          key={product.video_url}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={product.video_url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        />
      ) : null}
      <div className="absolute inset-0 bg-hud-grid bg-grid opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/30 via-void/70 to-void" />
      <div className="absolute inset-0 bg-vignette" />

      {/* Re-scan acknowledgement: brief red pulse, no remount of the layout. */}
      <AnimatePresence>
        {rescanCount > 0 ? (
          <motion.div
            key={rescanCount}
            className="pointer-events-none absolute inset-0 z-10 border-[6px] border-scarlet-500"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative flex h-full items-center gap-16 pl-[90px] pr-[120px]">
        <ProductImage product={product} />

        <motion.div
          className="flex min-w-0 flex-1 flex-col"
          variants={textColumn}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={textItem}
            className="flex items-center gap-4 font-hud text-2xl font-semibold tracking-[0.4em] text-crimson-400"
          >
            <span className="h-3 w-3 animate-pulse-dot bg-scarlet-500 shadow-glow-sm" />
            PRODUCT IDENTIFIED
            <span className="text-graphite-400">{`// ${product.barcode_id}`}</span>
          </motion.div>

          <motion.h2
            variants={textItem}
            className="mt-6 line-clamp-3 font-display font-black uppercase leading-[1.08] tracking-wide text-white neon-text-soft"
            style={{ fontSize: titleSize(product.title) }}
          >
            {product.title}
          </motion.h2>

          <motion.div
            variants={lineItem}
            className="mt-8 h-[3px] w-full origin-left bg-gradient-to-r from-scarlet-500 via-crimson-500/60 to-transparent shadow-glow-sm"
          />

          {product.description ? (
            <motion.p
              variants={textItem}
              className="mt-8 line-clamp-4 max-w-[860px] font-sans text-[32px] font-light leading-snug text-graphite-200"
            >
              {product.description}
            </motion.p>
          ) : null}

          <motion.div variants={textItem} className="mt-12 flex items-end justify-between gap-10">
            <div>
              <span className="font-hud text-xl font-semibold tracking-[0.5em] text-graphite-400">PRICE</span>
              <div className="neon-text font-display text-[124px] font-black leading-none tabular-nums">
                {formatBaht(product.price)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right font-hud text-lg font-semibold leading-tight tracking-[0.3em] text-graphite-400">
                RETURNING
                <br />
                TO STANDBY
              </div>
              <CountdownRing key={deadline} deadline={deadline} durationMs={durationMs} size={190} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
