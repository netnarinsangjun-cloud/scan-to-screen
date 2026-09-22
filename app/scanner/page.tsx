"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ToastStack, useToasts } from "@/components/scanner/Toasts";
import { useQrScanner } from "@/hooks/useQrScanner";
import { useTvState } from "@/hooks/useTvState";
import { errorFeedback, successFeedback, unlockAudio } from "@/lib/feedback";
import { formatBaht, normaliseBarcode } from "@/lib/format";
import { fetchProduct, fetchProducts, pushBarcode, resetTv } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Via = "camera" | "manual" | "list";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [products, setProducts] = useState<Map<string, Product>>(() => new Map());
  const [lastSent, setLastSent] = useState<Product | null>(null);
  const [sendCount, setSendCount] = useState(0);
  const [manual, setManual] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toasts, push: toast, dismiss } = useToasts();

  const { row, realtime, pollOk, markSeen, broadcastNotFound } = useTvState();

  const productsRef = useRef(products);
  productsRef.current = products;

  // --- Catalogue (for instant lookups, TV status titles, and the quick list) ---
  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(new Map(list.map((p) => [p.barcode_id, p])));
      })
      .catch((err) => {
        console.warn("[scanner] product load failed", err);
        if (!cancelled) toast("error", "โหลดรายการสินค้าไม่ได้", "ตรวจสอบค่า Supabase ใน .env.local หรือการเชื่อมต่ออินเทอร์เน็ต");
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Stop the camera while the phone is locked / tab hidden (battery + heat).
  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // --- Send to TV -------------------------------------------------------------
  const sendToTv = useCallback(
    async (raw: string, via: Via) => {
      const code = normaliseBarcode(raw);
      if (!code) return;
      setSending(true);
      try {
        let product = productsRef.current.get(code) ?? null;
        if (!product) {
          product = await fetchProduct(code);
          if (product) {
            const found = product;
            setProducts((m) => new Map(m).set(found.barcode_id, found));
          }
        }

        if (!product) {
          errorFeedback();
          toast("error", "ไม่พบสินค้า", `บาร์โค้ด ${code} ไม่มีอยู่ในระบบ`);
          void broadcastNotFound(code);
          return;
        }

        if (via !== "camera") successFeedback();
        const next = await pushBarcode(code);
        markSeen(next);
        setLastSent(product);
        setSendCount((n) => n + 1);
        toast("success", "ส่งขึ้นจอแล้ว", product.title);
        if (via === "manual") setManual("");
      } catch (err) {
        console.warn("[scanner] send failed", err);
        errorFeedback();
        toast("error", "ส่งขึ้นจอไม่สำเร็จ", err instanceof Error ? err.message : "เครือข่ายขัดข้อง");
      } finally {
        setSending(false);
      }
    },
    [broadcastNotFound, markSeen, toast],
  );

  const onDecode = useCallback(
    (text: string) => {
      successFeedback(); // instant feedback on decode, before the network round-trip
      void sendToTv(text, "camera");
    },
    [sendToTv],
  );

  const { state: camState, error: camError } = useQrScanner(videoRef, {
    enabled: cameraOn && pageVisible,
    onDecode,
    debounceMs: 2_000,
  });

  const handleReset = async () => {
    setResetting(true);
    try {
      const next = await resetTv();
      if (next) markSeen(next);
      toast("info", "รีเซ็ตจอแล้ว", "จอกลับสู่หน้ารอสแกน");
    } catch (err) {
      errorFeedback();
      toast("error", "รีเซ็ตไม่สำเร็จ", err instanceof Error ? err.message : "เครือข่ายขัดข้อง");
    } finally {
      setResetting(false);
    }
  };

  const handleManual = (e: FormEvent) => {
    e.preventDefault();
    unlockAudio();
    void sendToTv(manual, "manual");
  };

  const tvProduct = row?.current_barcode_id ? products.get(row.current_barcode_id) : undefined;
  const tvLabel = row?.current_barcode_id ? `กำลังแสดง · ${tvProduct?.title ?? row.current_barcode_id}` : "ว่าง (หน้ารอสแกน)";
  const productList = useMemo(() => Array.from(products.values()), [products]);

  const linkDot =
    realtime === "live" ? "bg-crimson-500 shadow-glow-sm" : pollOk ? "bg-amber-400" : "bg-graphite-400";

  return (
    <main className="min-h-dvh bg-void bg-hud-grid bg-grid pb-[max(24px,env(safe-area-inset-bottom))]">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Header / TV status */}
      <header className="sticky top-0 z-40 border-b border-crimson-500/30 bg-void/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="neon-text font-display text-lg font-black tracking-[0.2em]">BOOTH SCANNER</h1>
          <span className="flex items-center gap-2 font-hud text-xs font-semibold tracking-wide text-graphite-300">
            <span className={`h-2 w-2 animate-pulse-dot rounded-full ${linkDot}`} />
            {realtime === "live" ? "ออนไลน์" : pollOk ? "ซิงก์สำรอง" : "ออฟไลน์"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 font-hud text-sm font-semibold tracking-wide">
          <span className="text-graphite-400">สถานะจอ:</span>
          <motion.span
            key={tvLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`truncate ${row?.current_barcode_id ? "text-crimson-200" : "text-graphite-200"}`}
          >
            {tvLabel}
          </motion.span>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-5">
        {/* Viewfinder */}
        <section className="relative aspect-square w-full overflow-hidden border border-crimson-500/40 bg-black shadow-glow-inset">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline autoPlay />

          {/* Frame overlay */}
          <div className="pointer-events-none absolute inset-[14%]">
            <div className="hud-corners absolute inset-0" />
            <div className="absolute inset-0 border border-crimson-500/20" />
            {camState === "scanning" ? (
              // Wrapper is frame-sized, so translateY(100%) = exactly one frame height.
              <div className="absolute inset-0 animate-laser" style={{ ["--laser-travel" as string]: "100%" }}>
                <div className="h-[2px] w-full bg-scarlet-500 shadow-glow" />
              </div>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-40" />

          {camState !== "scanning" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/85 p-6 text-center">
              {camState === "starting" ? (
                <p className="animate-pulse font-hud text-lg font-semibold tracking-wide text-crimson-200">
                  กำลังเปิดกล้อง…
                </p>
              ) : (
                <>
                  {camError ? <p className="text-sm text-scarlet-400">{camError}</p> : null}
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={() => {
                      unlockAudio();
                      setCameraOn(false);
                      // Re-toggle on the next tick so a retry after an error re-runs the effect.
                      requestAnimationFrame(() => setCameraOn(true));
                    }}
                  >
                    {camError ? "RETRY CAMERA" : "START CAMERA"}
                  </button>
                  <p className="font-hud text-xs tracking-wide text-graphite-400">
                    กล้องต้องใช้ผ่าน HTTPS · แนะนำให้ใช้กล้องหลัง
                  </p>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCameraOn(false)}
              className="absolute bottom-3 right-3 border border-graphite-500 bg-void/70 px-3 py-2 font-hud text-xs font-bold tracking-wide text-graphite-200"
            >
              หยุดกล้อง
            </button>
          )}
          {sending ? (
            <div className="absolute left-3 top-3 bg-crimson-500 px-2 py-1 font-hud text-xs font-bold tracking-wide">
              กำลังส่ง…
            </div>
          ) : null}
        </section>

        {/* Last-sent confirmation card */}
        <AnimatePresence mode="popLayout">
          {lastSent ? (
            <motion.section
              key={sendCount}
              className="hud-panel flex items-center gap-4 p-3"
              // Spring pop so a confirmed send is felt, not just seen.
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden bg-graphite-800">
                {lastSent.image_url ? (
                  <img src={lastSent.image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-hud text-[11px] font-bold tracking-wide text-crimson-400">
                  {row?.current_barcode_id === lastSent.barcode_id ? "● กำลังแสดงบนจอ" : "ส่งแล้ว"}
                </p>
                <p className="truncate font-display text-sm font-bold uppercase">{lastSent.title}</p>
                <p className="neon-text font-display text-xl font-black">{formatBaht(lastSent.price)}</p>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Manual entry fallback */}
        <form onSubmit={handleManual} className="flex flex-col gap-3">
          <label htmlFor="manual" className="font-hud text-xs font-bold tracking-wide text-graphite-300">
            กรอกบาร์โค้ดเอง
          </label>
          <input
            id="manual"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="send"
            placeholder="เช่น 8850001000019"
            className="h-14 border border-crimson-500/50 bg-graphite-900 px-4 font-hud text-xl tracking-[0.15em] text-white outline-none placeholder:text-graphite-500 focus:border-scarlet-500 focus:shadow-glow"
          />
          <button type="submit" className="btn-primary" disabled={!manual.trim() || sending}>
            SEND TO TV
          </button>
        </form>

        <button type="button" className="btn-ghost" onClick={handleReset} disabled={resetting}>
          {resetting ? "กำลังรีเซ็ต…" : "RESET TV"}
        </button>

        {/* Quick-pick list — handy for demos and when a label is damaged */}
        {productList.length > 0 ? (
          <details className="border border-graphite-600 bg-graphite-900/60">
            <summary className="cursor-pointer list-none px-4 py-4 font-hud text-sm font-bold tracking-wide text-graphite-200">
              รายการสินค้า ({productList.length}) ▾
            </summary>
            <ul className="divide-y divide-graphite-700">
              {productList.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      unlockAudio();
                      void sendToTv(p.barcode_id, "list");
                    }}
                    className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-2 text-left active:bg-crimson-500/20"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block font-hud text-xs tracking-[0.15em] text-graphite-400">{p.barcode_id}</span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold text-crimson-200">
                      {formatBaht(p.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </main>
  );
}
