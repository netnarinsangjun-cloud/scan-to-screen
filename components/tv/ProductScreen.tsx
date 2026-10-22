"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/lib/types";
import { CountdownRing } from "./CountdownRing";
import { SunriseBackdrop } from "./SunriseBackdrop";

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
  exit: { opacity: 0, scale: 0.985, transition: { duration: 0.4, ease: [0.4, 0, 1, 1] } },
};

// Parent orchestrates the text column. staggerChildren 0.12 s gives the eye
// time to register each line (label → title → description → price) as a
// separate beat, while the whole cascade still completes in < 1 s.
// delayChildren waits for the image spring to be mostly settled.
const textColumn: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.18 } },
};

// Each line rises from below (opacity + y only) on an expo-out curve: it
// arrives quickly and settles softly, which suits the calm, premium tone.
const textItem: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// Divider ribbon draws from the left.
const lineItem: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { scaleX: 1, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative flex h-[780px] w-[780px] shrink-0 items-center justify-center">
      {/* Warm sun aura behind the product (radial gradient, no blur filter). */}
      <motion.div
        className="absolute inset-[-110px] rounded-full bg-red-radial"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0.75, 1, 0.75], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Slowly counter-rotating rings: a thin red ribbon arc and a gold dotted orbit */}
      <motion.div
        className="absolute inset-[18px] rounded-full border-[3px] border-transparent"
        style={{ borderTopColor: "#CC122A", borderRightColor: "rgba(204,18,42,.35)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[56px] rounded-full border-2 border-dotted border-gold-400/70"
        animate={{ rotate: -360 }}
        transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
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
          animate={{ y: [-12, 12], rotate: [-1.5, 1.5] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <div className="relative h-[580px] w-[580px] overflow-hidden rounded-[40px] border-[10px] border-white bg-gold-50 shadow-glow-lg">
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
              <div className="flex h-full w-full items-center justify-center bg-sunrise">
                <span className="brand-text text-[160px] font-extrabold">{product.title.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Step the title size down for long names so it fits the ~860 px column in ≤ 3 lines. */
function titleSize(title: string): number {
  if (title.length > 34) return 56;
  if (title.length > 22) return 66;
  if (title.length > 14) return 78;
  return 92;
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
      <SunriseBackdrop sunX={560} sunY={520} horizonFromBottom={150} skylineOpacity={0.55} ribbonHeight={150} />

      {product.video_url ? (
        <>
          <video
            key={product.video_url}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            src={product.video_url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
          />
          {/* Keep the right-hand text column on a bright, readable ground */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-white/90" />
        </>
      ) : null}

      {/* Re-scan acknowledgement: brief red frame pulse, no remount of the layout. */}
      <AnimatePresence>
        {rescanCount > 0 ? (
          <motion.div
            key={rescanCount}
            className="pointer-events-none absolute inset-0 z-10 border-[10px] border-crimson-500"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative flex h-full items-center gap-14 pb-[60px] pl-[90px] pr-[120px]">
        <ProductImage product={product} />

        <motion.div className="flex min-w-0 flex-1 flex-col" variants={textColumn} initial="initial" animate="animate">
          <motion.div variants={textItem} className="flex items-center gap-4 text-2xl font-semibold tracking-[0.22em] text-crimson-500">
            <span className="h-3 w-3 animate-pulse-dot rounded-full bg-crimson-500" />
            PRODUCT HIGHLIGHT
            <span className="font-medium tracking-[0.15em] text-graphite-400">· {product.barcode_id}</span>
          </motion.div>

          <motion.h2
            variants={textItem}
            className="title-shadow mt-5 line-clamp-3 font-extrabold leading-[1.1] text-ink"
            style={{ fontSize: titleSize(product.title) }}
          >
            {product.title}
          </motion.h2>

          <motion.div
            variants={lineItem}
            className="mt-7 h-[6px] w-[520px] origin-left rounded-full"
            style={{ background: "linear-gradient(90deg, #960018, #CC122A 40%, #F7C88A 80%, transparent)" }}
          />

          {product.description ? (
            <motion.p variants={textItem} className="mt-7 line-clamp-4 max-w-[860px] text-[32px] font-normal leading-snug text-ink-soft">
              {product.description}
            </motion.p>
          ) : null}

          <motion.div variants={textItem} className="mt-10 flex items-end justify-between gap-10">
            <div>
              <span className="text-xl font-semibold tracking-[0.3em] text-graphite-300">PRICE</span>
              <div className="brand-text text-[124px] font-extrabold leading-[1.15] tabular-nums">{formatBaht(product.price)}</div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right text-xl font-medium leading-snug text-graphite-300">
                กลับหน้าหลักใน
              </div>
              <CountdownRing key={deadline} deadline={deadline} durationMs={durationMs} size={190} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
