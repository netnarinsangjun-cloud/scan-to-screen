"use client";

import { motion } from "framer-motion";
import { memo } from "react";

interface Props {
  /** Sun centre in canvas px. */
  sunX?: number;
  sunY?: number;
  /** Height of the flowing ribbon band at the bottom. */
  ribbonHeight?: number;
}

/* --------------------------------------------------------------------------
 * Ribbons: seamless waves (period = canvas width) drawn twice side by side and
 * slid left with a CSS transform loop — compositor-only, no per-frame paint.
 * ------------------------------------------------------------------------ */

function wave(y: number, amp: number, thickness: number | null, h: number): string {
  // Each 1920-px period starts and ends at the same point with the same
  // tangent, so two copies tile without a seam.
  const seg = (o: number) => `C${o + 480},${y - amp} ${o + 1440},${y + amp} ${o + 1920},${y}`;
  if (thickness === null) return `M0,${y} ${seg(0)} ${seg(1920)} L3840,${h} L0,${h} Z`;
  const yb = y + thickness;
  const back = (o: number) => `C${o + 1440},${yb + amp} ${o + 480},${yb - amp} ${o},${yb}`;
  return `M0,${y} ${seg(0)} ${seg(1920)} L3840,${yb} ${back(1920)} ${back(0)} Z`;
}

const Ribbons = memo(function Ribbons({ height }: { height: number }) {
  const h = height;
  const layers = [
    { d: wave(h * 0.34, h * 0.26, h * 0.18, h), fill: "#FFF4E6", opacity: 0.9, duration: 64 },
    { d: wave(h * 0.48, h * 0.34, null, h), fill: "url(#ribbon-red)", opacity: 1, duration: 46 },
    { d: wave(h * 0.45, h * 0.34, h * 0.035, h), fill: "#F7C88A", opacity: 0.9, duration: 46 },
    { d: wave(h * 0.76, h * 0.2, null, h), fill: "url(#ribbon-cream)", opacity: 1, duration: 34 },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: h }} aria-hidden>
      <svg width={0} height={0} className="absolute">
        <defs>
          <linearGradient id="ribbon-red" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#960018" />
            <stop offset="0.3" stopColor="#CC122A" />
            <stop offset="0.55" stopColor="#E3263A" />
            <stop offset="0.8" stopColor="#B40C24" />
            <stop offset="1" stopColor="#960018" />
          </linearGradient>
          <linearGradient id="ribbon-cream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F3EDEA" />
          </linearGradient>
        </defs>
      </svg>
      {layers.map((l, i) => (
        <svg
          key={i}
          viewBox={`0 0 3840 ${h}`}
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0"
          style={{
            width: 3840,
            height: h,
            opacity: l.opacity,
            animation: `ribbon-slide ${l.duration}s linear infinite`,
          }}
        >
          <path d={l.d} fill={l.fill} />
        </svg>
      ))}
      <style>{`@keyframes ribbon-slide{from{transform:translate3d(0,0,0)}to{transform:translate3d(-1920px,0,0)}}`}</style>
    </div>
  );
});

/* --------------------------------------------------------------------------
 * Backdrop
 * ------------------------------------------------------------------------ */

export function SunriseBackdrop({
  sunX = 1360,
  sunY = 700,
  ribbonHeight = 220,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-sunrise" aria-hidden>
      {/* Sun: soft radial glow that breathes slowly (scale + opacity only). */}
      <motion.div
        className="absolute h-[900px] w-[900px] rounded-full bg-sun"
        style={{ left: sunX - 450, top: sunY - 450 }}
        animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.85, 1, 0.85] }}
        // 7 s easeInOut — a slow "sunrise breath" that never draws the eye on its own.
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {ribbonHeight > 0 ? <Ribbons height={ribbonHeight} /> : null}
    </div>
  );
}
