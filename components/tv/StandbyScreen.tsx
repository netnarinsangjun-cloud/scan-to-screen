"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { BOOTH_LABEL } from "@/lib/config";
import type { RealtimeStatus } from "@/lib/types";
import { ParticleField } from "./ParticleField";

interface Props {
  realtime: RealtimeStatus;
  pollOk: boolean;
  productCount: number;
}

// Screen-level fade. A slightly longer exit than enter keeps the standby
// visible underneath the scan wipe, so the cut never flashes empty black.
const screenVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.04, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
};

function StatusIndicator({ realtime, pollOk }: Omit<Props, "productCount">) {
  const { label, dot, text } =
    realtime === "live"
      ? { label: "SYSTEM READY", dot: "bg-crimson-500 shadow-glow-sm", text: "text-graphite-50" }
      : pollOk
        ? realtime === "connecting"
          ? { label: "SYSTEM BOOTING · LINKING", dot: "bg-amber-400", text: "text-amber-200" }
          : { label: "SYSTEM READY · FALLBACK SYNC", dot: "bg-amber-400", text: "text-amber-200" }
        : { label: "OFFLINE · LOCAL SCANNER ONLY", dot: "bg-graphite-400", text: "text-graphite-300" };

  return (
    <div className="flex items-center gap-3 font-hud text-xl font-semibold tracking-[0.3em]">
      <span className={`h-3 w-3 animate-pulse-dot rounded-full ${dot}`} />
      <span className={text}>{label}</span>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{now}</span>;
}

/** Wireframe "reactor core": rings + cube built from CSS 3D transforms (no WebGL). */
function CoreShape() {
  const faces = [
    "rotateY(0deg)",
    "rotateY(90deg)",
    "rotateY(180deg)",
    "rotateY(-90deg)",
    "rotateX(90deg)",
    "rotateX(-90deg)",
  ];
  const cube = 200;

  return (
    <div className="absolute left-1/2 top-[37%] -translate-x-1/2 -translate-y-1/2" style={{ perspective: 1400 }}>
      <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-red-radial opacity-70" />
      {/* Outer: slow wobble on X. Separate element from the Y spin so the two
          loops have independent periods and the motion never visibly repeats. */}
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateX: [18, -14, 18] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Inner: continuous Y spin — linear so the rotation speed is constant (no "hitch" at loop point). */}
        <motion.div
          className="relative h-[460px] w-[460px]"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[0, 60, 120].map((deg) => (
            <div
              key={deg}
              className="absolute inset-0 rounded-full border-2 border-crimson-500/60"
              style={{
                transform: `rotateY(${deg}deg)`,
                boxShadow: "0 0 24px rgba(220,20,60,.35), inset 0 0 24px rgba(220,20,60,.25)",
              }}
            />
          ))}
          <div
            className="absolute inset-[40px] rounded-full border border-dashed border-scarlet-500/50"
            style={{ transform: "rotateX(90deg)" }}
          />
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: cube,
              height: cube,
              marginLeft: -cube / 2,
              marginTop: -cube / 2,
              transformStyle: "preserve-3d",
              transform: "rotateX(35deg) rotateZ(45deg)",
            }}
          >
            {faces.map((f) => (
              <div
                key={f}
                className="absolute inset-0 border-2 border-scarlet-500/80 bg-crimson-500/[0.06]"
                style={{
                  transform: `${f} translateZ(${cube / 2}px)`,
                  boxShadow: "inset 0 0 30px rgba(255,36,0,.25)",
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-scarlet-500/80 blur-2xl" />
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
      {/* Perspective floor grid, panning toward the viewer */}
      <div className="absolute inset-x-0 bottom-0 h-[520px] overflow-hidden" style={{ perspective: 600 }}>
        <div
          className="absolute -inset-x-[50%] -top-[120px] h-[900px] origin-top"
          style={{ transform: "rotateX(62deg)" }}
        >
          <div className="h-[1200px] w-full animate-grid-pan bg-hud-grid-strong bg-grid-lg opacity-40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/40 to-transparent" />
      </div>
      <div className="absolute inset-0 bg-hud-grid bg-grid opacity-40" />

      <ParticleField count={44} />
      <CoreShape />
      <div className="absolute inset-0 bg-vignette" />

      {/* Top HUD bar */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-20 pt-14 font-hud text-xl font-semibold tracking-[0.4em] text-graphite-200">
        <span className="text-crimson-400">{BOOTH_LABEL}</span>
        <span className="flex items-center gap-8">
          <span className="text-graphite-400">CATALOGUE {String(productCount).padStart(3, "0")}</span>
          <Clock />
        </span>
      </header>

      {/* Call to action */}
      <div className="absolute inset-x-0 bottom-[190px] flex flex-col items-center gap-6 text-center">
        <motion.span
          className="font-hud text-2xl font-semibold tracking-[0.6em] text-crimson-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          ▼ AWAITING INPUT ▼
        </motion.span>
        <motion.h1
          className="font-display text-[132px] font-black leading-none tracking-[0.08em] text-white"
          // "Breathing" neon: glow radius, brightness and size swell together on
          // an easeInOut sine-like loop. 2.4 s ≈ a calm resting breath, which
          // feels alive without being distracting over hours of idle time.
          animate={{
            opacity: [0.82, 1, 0.82],
            scale: [1, 1.025, 1],
            textShadow: [
              "0 0 6px rgba(255,36,0,.6), 0 0 18px rgba(220,20,60,.45), 0 0 40px rgba(220,20,60,.2)",
              "0 0 10px rgba(255,36,0,1), 0 0 36px rgba(220,20,60,.9), 0 0 90px rgba(220,20,60,.55)",
              "0 0 6px rgba(255,36,0,.6), 0 0 18px rgba(220,20,60,.45), 0 0 40px rgba(220,20,60,.2)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          SCAN PRODUCT NOW
        </motion.h1>
        <p className="font-sans text-3xl font-light tracking-wide text-graphite-200">
          สแกนบาร์โค้ดสินค้าเพื่อดูรายละเอียดบนจอ
        </p>
      </div>

      {/* Bottom HUD bar */}
      <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between px-20 pb-14">
        <StatusIndicator realtime={realtime} pollOk={pollOk} />
        <span className="font-hud text-lg tracking-[0.4em] text-graphite-400">USB · MOBILE · QR · EAN</span>
      </footer>
    </motion.section>
  );
}
