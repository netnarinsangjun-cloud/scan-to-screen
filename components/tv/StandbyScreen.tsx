"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
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

export function StandbyScreen({ realtime, pollOk, productCount }: Props) {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-void"
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <SunriseBackdrop sunX={960} sunY={520} ribbonHeight={200} />
      <ParticleField count={36} />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-end px-20 pt-12">
        <div className="flex items-center gap-6">
          <StatusIndicator realtime={realtime} pollOk={pollOk} />
          <span className="text-xl font-semibold tracking-[0.15em] text-graphite-300">
            {String(productCount).padStart(3, "0")} ITEMS · <Clock />
          </span>
        </div>
      </header>

      {/* Call to action */}
      <div className="absolute inset-x-0 top-[400px] flex flex-col items-center text-center">
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
