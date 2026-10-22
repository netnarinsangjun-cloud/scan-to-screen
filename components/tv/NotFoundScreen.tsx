"use client";

import { motion } from "framer-motion";
import { NOT_FOUND_MS } from "@/lib/config";
import { SunriseBackdrop } from "./SunriseBackdrop";

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
      <SunriseBackdrop sunX={960} sunY={760} horizonFromBottom={200} skylineOpacity={0.5} ribbonHeight={170} />

      <div className="relative flex h-full flex-col items-center justify-center gap-8 pb-24 text-center">
        {/* Icon pops in with a springy overshoot, then wobbles once — a friendly "hmm?" */}
        <motion.div
          className="flex h-36 w-36 items-center justify-center rounded-full border-[6px] border-crimson-500 bg-white shadow-glow-lg"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: [-30, 12, -6, 0] }}
          transition={{ scale: { type: "spring", stiffness: 380, damping: 18 }, rotate: { duration: 0.6, ease: "easeOut" } }}
        >
          <span className="brand-text text-[92px] font-extrabold leading-none">?</span>
        </motion.div>

        {/* Short horizontal shake (eased, decaying amplitude): a clear "no match"
            signal that still feels polished rather than glitchy. */}
        <motion.h1
          className="title-shadow text-[128px] font-extrabold leading-none tracking-tight text-ink"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -28, 22, -14, 8, 0] }}
          transition={{ opacity: { duration: 0.15 }, x: { duration: 0.5, ease: "easeOut" } }}
        >
          PRODUCT <span className="brand-text">NOT FOUND</span>
        </motion.h1>

        <div className="card-panel rounded-full px-10 py-4">
          <span className="text-2xl font-semibold tracking-[0.25em] text-graphite-300">
            SCANNED CODE: <span className="text-crimson-600">{code || "—"}</span>
          </span>
        </div>

        <p className="text-[34px] font-medium text-ink-soft">ไม่พบสินค้านี้ในระบบ กรุณาสแกนใหม่อีกครั้ง</p>

        <div className="mt-4 h-2.5 w-[640px] overflow-hidden rounded-full bg-crimson-100">
          <motion.div
            className="h-full origin-left rounded-full bg-ribbon-red"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: NOT_FOUND_MS / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </motion.section>
  );
}
