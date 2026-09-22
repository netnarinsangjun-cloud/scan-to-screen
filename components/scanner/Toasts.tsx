"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

/** Minimal toast queue: max 3 visible, each auto-dismisses after 3 s. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, detail?: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((list) => [...list.slice(-2), { id, tone, title, detail }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 3_000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return { toasts, push, dismiss };
}

const toneStyles: Record<ToastTone, string> = {
  success: "border-crimson-500 bg-graphite-900/95 text-white",
  error: "border-scarlet-500 bg-crimson-900/95 text-white",
  info: "border-graphite-500 bg-graphite-900/95 text-graphite-50",
};

const toneIcon: Record<ToastTone, string> = { success: "✓", error: "✕", info: "i" };

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 border-l-4 px-4 py-3 text-left shadow-glow backdrop-blur ${toneStyles[t.tone]}`}
            // Drop in from above with a snappy spring; `layout` is fine here
            // because it's a tiny element, not the whole screen.
            layout
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-crimson-500 font-hud text-sm font-bold">
              {toneIcon[t.tone]}
            </span>
            <span className="min-w-0">
              <span className="block font-hud text-lg font-bold uppercase tracking-wider">{t.title}</span>
              {t.detail ? <span className="block truncate text-sm text-graphite-200">{t.detail}</span> : null}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
