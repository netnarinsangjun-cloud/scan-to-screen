"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { BOOTH_LABEL } from "@/lib/config";
import type { RealtimeStatus } from "@/lib/types";
import { ParticleField } from "./ParticleField";
import { SunriseBackdrop } from "./SunriseBackdrop";

interface Props {
  realtime: RealtimeStatus;
  pollOk: boolean;
  productCount: number;
}

// Screen-level fade. A slightly longer exit than enter keeps the standby
// visible underneath the scan wipe, so the cut never flashes an empty frame.
const screenVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.03, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
};

function StatusIndicator({ realtime, pollOk }: Omit<Props, "productCount">) {
  const { label, dot } =
    realtime === "live"
      ? { label: "SYSTEM READY", dot: "bg-crimson-500" }
      : pollOk
        ? realtime === "connecting"
          ? { label: "CONNECTING…", dot: "bg-gold-400" }
          : { label: "SYSTEM READY · BACKUP SYNC", dot: "bg-gold-400" }
        : { label: "OFFLINE · LOCAL SCANNER ONLY", dot: "bg-graphite-400" };

  return (
    <div className="flex items-center gap-3 rounded-full border border-graphite-600 bg-white/80 px-5 py-2.5 text-lg font-semibold tracking-[0.18em] text-graphite-100 shadow-glow-inset">
      <span className={`h-3 w-3 animate-pulse-dot rounded-full ${dot}`} />
      {label}
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<string>("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{now}</span>;
}

const RING = 460;
const R = 178;
const STROKE = 62;

/**
 * Ribbon ring with a sunrise inside — a 3D-ish abstract shape built from an
 * SVG ring + CSS 3D transforms (no WebGL). Inspired by the "0" of the artwork.
 */
function RibbonRing() {
  const c = RING / 2;
  return (
    <div className="absolute left-1/2 top-[330px] -translate-x-1/2 -translate-y-1/2" style={{ perspective: 1600 }}>
      {/* Gentle 3D sway: rotateY ±16° on a slow sine. Never a full spin, so the
          ribbon always reads as a ring rather than a flipping coin. */}
      <motion.div
        className="relative"
        style={{ width: RING, height: RING, transformStyle: "preserve-3d" }}
        animate={{ rotateY: [-16, 16, -16], rotateX: [6, -4, 6] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Golden orbit, tilted into the scene and spinning in its own plane */}
        <div className="absolute inset-[-70px]" style={{ transform: "rotateX(74deg)", transformStyle: "preserve-3d" }}>
          <motion.div
            className="h-full w-full rounded-full border-[3px] border-gold-300"
            style={{ borderTopColor: "transparent", borderLeftColor: "rgba(204,18,42,.55)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <svg viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 overflow-visible drop-shadow-glow-lg" aria-hidden>
          <defs>
            <linearGradient id="ring-red" x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0" stopColor="#E0293F" />
              <stop offset="0.45" stopColor="#CC122A" />
              <stop offset="1" stopColor="#7E0014" />
            </linearGradient>
            <radialGradient id="ring-sun" cx="0.62" cy="0.62" r="0.6">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.25" stopColor="#FFF4D9" />
              <stop offset="0.7" stopColor="#FCDEB4" />
              <stop offset="1" stopColor="#F7C88A" />
            </radialGradient>
            <clipPath id="ring-inner">
              <circle cx={c} cy={c} r={R - STROKE / 2 + 2} />
            </clipPath>
          </defs>

          {/* Sunrise inside the ring, with a small skyline silhouette */}
          <g clipPath="url(#ring-inner)">
            <rect x={0} y={0} width={RING} height={RING} fill="url(#ring-sun)" />
            <path
              d={`M60,${c + 70} L120,${c + 70} L128,${c + 10} L134,${c - 30} L140,${c + 10} L148,${c + 70} L190,${c + 70} L196,${c + 30} L202,${c - 5} L208,${c + 30} L214,${c + 70}
                 L250,${c + 70} L250,${c - 10} L276,${c - 10} L276,${c + 70} L284,${c + 70} L284,${c - 50} L304,${c - 50} L304,${c + 70} L314,${c + 70} L314,${c + 5} L342,${c + 5} L342,${c + 70} L400,${c + 70} L400,${RING} L60,${RING} Z`}
              fill="#E5707F"
              opacity={0.55}
            />
            <rect x={0} y={c + 70} width={RING} height={RING} fill="#FCE3C4" opacity={0.9} />
          </g>

          {/* The ribbon ring */}
          <circle cx={c} cy={c} r={R} fill="none" stroke="url(#ring-red)" strokeWidth={STROKE} />

          {/* Moving shine along the ribbon (rotation of a short highlight arc) */}
          {/* Framer rotates SVG groups around their own bbox centre = the ring centre. */}
          <motion.g
            animate={{ rotate: 360 }}
            // Linear 7 s loop: a constant, calm sweep — like light catching satin.
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <circle
              cx={c}
              cy={c}
              r={R + STROKE * 0.22}
              fill="none"
              stroke="rgba(255,255,255,.55)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * R * 0.16} ${2 * Math.PI * R}`}
            />
          </motion.g>

          {/* Ribbon tail sweeping out to the right */}
          <path
            d={`M${c + R * 0.6},${c + R * 0.86} C${c + R * 1.3},${c + R * 0.95} ${c + R * 1.75},${c + R * 0.55} ${c + R * 2.3},${c + R * 0.62}
               L${c + R * 2.3},${c + R * 0.7} C${c + R * 1.75},${c + R * 0.7} ${c + R * 1.3},${c + R * 1.12} ${c + R * 0.52},${c + R * 1.02} Z`}
            fill="url(#ring-red)"
            opacity={0.9}
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function StandbyScreen({ realtime, pollOk, productCount }: Props) {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-void"
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <SunriseBackdrop sunX={1420} sunY={790} horizonFromBottom={230} skylineOpacity={0.85} ribbonHeight={200} />
      <ParticleField count={36} />
      <RibbonRing />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-20 pt-12">
        <span className="text-xl font-bold tracking-[0.35em] text-crimson-500">{BOOTH_LABEL}</span>
        <div className="flex items-center gap-6">
          <StatusIndicator realtime={realtime} pollOk={pollOk} />
          <span className="text-xl font-semibold tracking-[0.15em] text-graphite-300">
            {String(productCount).padStart(3, "0")} ITEMS · <Clock />
          </span>
        </div>
      </header>

      {/* Call to action */}
      <div className="absolute inset-x-0 top-[600px] flex flex-col items-center text-center">
        {/* Soft warm halo behind the headline; its opacity breathes in sync with the text. */}
        <motion.div
          className="absolute top-[-90px] h-[340px] w-[1500px] rounded-[50%]"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,.95) 0%, rgba(255,246,232,.75) 45%, transparent 72%)" }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.h1
          className="relative text-[124px] font-extrabold leading-none tracking-tight"
          // Calm "breathing": scale + opacity swell together on an easeInOut loop.
          // 2.6 s ≈ a resting breath — alive, but not distracting over hours of idle time.
          animate={{ scale: [1, 1.025, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-ink">SCAN </span>
          <span className="brand-text">PRODUCT NOW</span>
        </motion.h1>
        <p className="relative mt-6 text-[40px] font-medium text-ink-soft">สแกนบาร์โค้ดสินค้าเพื่อดูรายละเอียดบนจอ</p>
      </div>
    </motion.section>
  );
}
