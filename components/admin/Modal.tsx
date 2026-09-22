"use client";

import { motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Shared dialog shell. Render inside <AnimatePresence> for the exit animation. */
export function Modal({ title, onClose, children, footer, wide = false }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92dvh] w-full flex-col border border-crimson-500/50 bg-graphite-900 shadow-glow ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
        // Sheet slides up on phones; a short spring keeps it snappy, not bouncy.
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <header className="flex items-center justify-between border-b border-crimson-500/30 px-5 py-4">
          <h2 className="font-display text-lg font-bold tracking-wider text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center text-2xl text-graphite-300 hover:text-white"
            aria-label="ปิด"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="border-t border-crimson-500/30 px-5 py-4">{footer}</footer> : null}
      </motion.div>
    </motion.div>
  );
}
