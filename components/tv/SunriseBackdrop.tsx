"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";

interface Props {
  /** Sun centre in canvas px. */
  sunX?: number;
  sunY?: number;
  /** Skyline + water band height above the bottom edge (0 hides them). */
  horizonFromBottom?: number;
  skylineOpacity?: number;
  /** Height of the flowing ribbon band at the bottom. */
  ribbonHeight?: number;
}

/* --------------------------------------------------------------------------
 * Skyline: Thai temple spires (left), a cable-stayed bridge (middle) and a
 * modern city (right), generated once as a single SVG path per layer.
 * ------------------------------------------------------------------------ */

const SKY_W = 1920;
const SKY_H = 260;

function prang(cx: number, w: number, h: number): string {
  // Stepped Khmer-style spire: 6 tiers narrowing to a needle.
  const base = SKY_H;
  const tiers = 6;
  let d = `M${cx - w / 2},${base}`;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const half = (w / 2) * (1 - t0 * 0.82);
    const y = base - h * 0.78 * ((i + 1) / tiers);
    d += ` L${cx - half},${base - h * 0.78 * (i / tiers)} L${cx - half},${y} L${cx - half * 0.86},${y}`;
  }
  d += ` L${cx},${base - h}`;
  for (let i = tiers - 1; i >= 0; i--) {
    const t0 = i / tiers;
    const half = (w / 2) * (1 - t0 * 0.82);
    const y = base - h * 0.78 * ((i + 1) / tiers);
    d += ` L${cx + half * 0.86},${y} L${cx + half},${y} L${cx + half},${base - h * 0.78 * (i / tiers)}`;
  }
  return `${d} L${cx + w / 2},${base} Z`;
}

function chedi(cx: number, w: number, h: number): string {
  // Bell-shaped stupa with a tall tapering spire.
  const b = SKY_H;
  return [
    `M${cx - w / 2},${b}`,
    `L${cx - w / 2},${b - h * 0.12}`,
    `Q${cx - w / 2},${b - h * 0.48} ${cx - w * 0.12},${b - h * 0.52}`,
    `L${cx - w * 0.05},${b - h * 0.6}`,
    `L${cx},${b - h}`,
    `L${cx + w * 0.05},${b - h * 0.6}`,
    `L${cx + w * 0.12},${b - h * 0.52}`,
    `Q${cx + w / 2},${b - h * 0.48} ${cx + w / 2},${b - h * 0.12}`,
    `L${cx + w / 2},${b} Z`,
  ].join(" ");
}

function towers(x0: number, x1: number, seed: number, minH: number, maxH: number): string {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  let d = "";
  let x = x0;
  while (x < x1) {
    const w = 26 + rand() * 46;
    const h = minH + rand() * (maxH - minH);
    const crown = rand() > 0.6 ? 10 + rand() * 18 : 0;
    d += `M${x},${SKY_H} L${x},${SKY_H - h} `;
    if (crown) d += `L${x + w * 0.3},${SKY_H - h} L${x + w * 0.3},${SKY_H - h - crown} L${x + w * 0.7},${SKY_H - h - crown} L${x + w * 0.7},${SKY_H - h} `;
    d += `L${x + w},${SKY_H - h} L${x + w},${SKY_H} Z `;
    x += w + 4 + rand() * 18;
  }
  return d;
}

function bridge(x0: number, x1: number): string {
  // Two slim A-frame pylons and a deck — rendered as thin filled shapes.
  const deckY = SKY_H - 34;
  const pylon = (cx: number) =>
    `M${cx - 9},${SKY_H} L${cx - 3},${SKY_H - 150} L${cx + 3},${SKY_H - 150} L${cx + 9},${SKY_H} Z `;
  const a = x0 + (x1 - x0) * 0.32;
  const b = x0 + (x1 - x0) * 0.68;
  return `M${x0},${deckY} L${x1},${deckY} L${x1},${deckY + 6} L${x0},${deckY + 6} Z ${pylon(a)}${pylon(b)}`;
}

function bridgeCables(x0: number, x1: number): string {
  const deckY = SKY_H - 34;
  const a = x0 + (x1 - x0) * 0.32;
  const b = x0 + (x1 - x0) * 0.68;
  let d = "";
  for (const top of [a, b]) {
    for (let i = 1; i <= 6; i++) {
      d += `M${top},${SKY_H - 146 + i * 6} L${top - i * 26},${deckY} `;
      d += `M${top},${SKY_H - 146 + i * 6} L${top + i * 26},${deckY} `;
    }
  }
  return d;
}

const Skyline = memo(function Skyline({ opacity }: { opacity: number }) {
  const paths = useMemo(() => {
    const back =
      towers(1180, 1920, 7, 70, 230) +
      prang(240, 120, 230) +
      chedi(520, 90, 170) +
      chedi(90, 70, 120);
    const front =
      prang(370, 150, 250) +
      prang(250, 80, 150) +
      prang(490, 80, 150) +
      chedi(660, 70, 130) +
      towers(1260, 1920, 3, 40, 150) +
      bridge(760, 1200);
    return { back, front, cables: bridgeCables(760, 1200) };
  }, []);

  return (
    <svg viewBox={`0 0 ${SKY_W} ${SKY_H}`} className="absolute inset-x-0 bottom-0 w-full" style={{ opacity }} aria-hidden>
      <defs>
        <linearGradient id="sky-haze-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9CFD6" />
          <stop offset="1" stopColor="#E9DCD8" />
        </linearGradient>
        <linearGradient id="sky-haze-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9BBC4" />
          <stop offset="1" stopColor="#E2CEC6" />
        </linearGradient>
      </defs>
      <path d={paths.back} fill="url(#sky-haze-back)" opacity={0.55} />
      <path d={paths.front} fill="url(#sky-haze-front)" opacity={0.7} />
      <path d={paths.cables} stroke="#C9BBC4" strokeWidth={1.4} opacity={0.6} fill="none" />
    </svg>
  );
});

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
  horizonFromBottom = 230,
  skylineOpacity = 1,
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

      {horizonFromBottom > 0 ? (
        <>
          {/* Skyline sits on the horizon line */}
          <div className="absolute inset-x-0" style={{ bottom: horizonFromBottom, height: SKY_H }}>
            <Skyline opacity={skylineOpacity} />
          </div>
          {/* Water: warm reflection below the horizon with a slow shimmer */}
          <div
            className="absolute inset-x-0 bottom-0 overflow-hidden"
            style={{
              height: horizonFromBottom,
              background: "linear-gradient(180deg, #F6E4DA 0%, #FCE3C4 30%, #FFF1DE 100%)",
            }}
          >
            <div
              className="absolute h-full w-[700px] animate-shimmer opacity-70"
              style={{
                left: sunX - 350,
                background:
                  "repeating-linear-gradient(180deg, rgba(255,255,255,.75) 0 2px, transparent 2px 14px), radial-gradient(ellipse at top, rgba(255,248,228,.9), transparent 70%)",
                maskImage: "linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent)",
                WebkitMaskImage: "linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent)",
              }}
            />
          </div>
        </>
      ) : null}

      {ribbonHeight > 0 ? <Ribbons height={ribbonHeight} /> : null}
    </div>
  );
}
