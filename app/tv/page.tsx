"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { NotFoundScreen } from "@/components/tv/NotFoundScreen";
import { ProductScreen } from "@/components/tv/ProductScreen";
import { ScanTransition } from "@/components/tv/ScanTransition";
import { StandbyScreen } from "@/components/tv/StandbyScreen";
import { TvCanvas } from "@/components/tv/TvCanvas";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useTvState, type RowSource } from "@/hooks/useTvState";
import { useWakeLock } from "@/hooks/useWakeLock";
import { NOT_FOUND_MS, PRODUCT_DISPLAY_MS, PRODUCT_REFRESH_MS, TRANSITION_MS, TV_STATE_ID } from "@/lib/config";
import { normaliseBarcode, toMs } from "@/lib/format";
import { fetchProduct, fetchProducts, pushBarcode, resetTv } from "@/lib/supabase";
import type { Product, TvState } from "@/lib/types";

type Screen =
  | { kind: "standby" }
  | { kind: "transition"; id: number; product: Product }
  | { kind: "product"; id: number; product: Product; deadline: number; rescan: number }
  | { kind: "not_found"; id: number; code: string };

type ScanOrigin = "usb" | "remote";

export default function TvPage() {
  const [screen, setScreen] = useState<Screen>({ kind: "standby" });
  const [productCount, setProductCount] = useState(0);

  // Mirror of `screen` for synchronous reads inside event handlers.
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const productsRef = useRef(new Map<string, Product>());
  // Decoded <img> objects are retained so the browser never evicts them from cache.
  const preloadedRef = useRef(new Map<string, HTMLImageElement>());
  const idRef = useRef(0);
  /** Bumped on every scan / reset; lets a slow lookup detect it has been superseded. */
  const scanSeqRef = useRef(0);
  /** updated_at of the newest tv_state we know about, for the conditional reset. */
  const latestUpdatedAtRef = useRef<string | null>(null);

  useWakeLock();

  // --- Product catalogue + image preloading --------------------------------
  const cacheProduct = useCallback((product: Product) => {
    productsRef.current.set(product.barcode_id, product);
    const url = product.image_url;
    if (url && !preloadedRef.current.has(url)) {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      img.decode().catch(() => undefined);
      preloadedRef.current.set(url, img);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await fetchProducts();
        if (cancelled) return;
        const fresh = new Map<string, Product>();
        list.forEach((p) => fresh.set(p.barcode_id, p));
        productsRef.current = fresh;
        list.forEach(cacheProduct);
        setProductCount(list.length);
      } catch (err) {
        console.warn("[tv] product load failed", err);
      }
    };
    void load();
    const id = setInterval(() => void load(), PRODUCT_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [cacheProduct]);

  // --- Screen transitions --------------------------------------------------
  const present = useCallback((product: Product) => {
    const current = screenRef.current;
    if (current.kind === "product" && current.product.barcode_id === product.barcode_id) {
      // Same product re-scanned: restart the countdown in place (no re-transition).
      setScreen({ ...current, product, deadline: Date.now() + PRODUCT_DISPLAY_MS, rescan: current.rescan + 1 });
      return;
    }
    if (current.kind === "transition" && current.product.barcode_id === product.barcode_id) {
      return; // already on its way; the product phase starts with a fresh 30 s
    }
    idRef.current += 1;
    setScreen({ kind: "transition", id: idRef.current, product });
  }, []);

  const showNotFound = useCallback((code: string) => {
    scanSeqRef.current += 1;
    idRef.current += 1;
    setScreen({ kind: "not_found", id: idRef.current, code });
  }, []);

  // Forward-declared so handleCode can register local writes with the hook.
  const markSeenRef = useRef<(row: TvState) => void>(() => undefined);

  const handleCode = useCallback(
    async (raw: string, origin: ScanOrigin) => {
      const code = normaliseBarcode(raw);
      if (!code) return;
      scanSeqRef.current += 1;
      const seq = scanSeqRef.current;

      // Fast path: cached product → synchronous, zero network before paint.
      let product = productsRef.current.get(code) ?? null;
      if (!product) {
        try {
          product = await fetchProduct(code);
          if (product) cacheProduct(product);
        } catch (err) {
          console.warn("[tv] lookup failed", err);
          product = null;
        }
        if (seq !== scanSeqRef.current) return; // a newer scan / reset won the race
      }

      if (!product) {
        showNotFound(code);
        return;
      }

      present(product);

      if (origin === "usb") {
        // Keep tv_state (and every phone) consistent. Register the row first so
        // the Realtime echo of our own write is ignored rather than replayed.
        const updatedAt = new Date().toISOString();
        const row: TvState = { id: TV_STATE_ID, current_barcode_id: code, updated_at: updatedAt };
        markSeenRef.current(row);
        latestUpdatedAtRef.current = updatedAt;
        pushBarcode(code, updatedAt).catch((err) => console.warn("[tv] tv_state write failed", err));
      }
    },
    [cacheProduct, present, showNotFound],
  );

  const onRow = useCallback(
    (row: TvState, source: RowSource) => {
      latestUpdatedAtRef.current = row.updated_at;

      if (source === "initial") {
        // Resume a product only if it was scanned moments ago (e.g. the TV tab reloaded);
        // otherwise clear a stale value left from a previous session.
        if (row.current_barcode_id) {
          if (Date.now() - toMs(row.updated_at) < PRODUCT_DISPLAY_MS) {
            void handleCode(row.current_barcode_id, "remote");
          } else {
            resetTv(row.updated_at)
              .then((next) => {
                if (next) {
                  markSeenRef.current(next);
                  latestUpdatedAtRef.current = next.updated_at;
                }
              })
              .catch(() => undefined);
          }
        }
        return;
      }

      if (!row.current_barcode_id) {
        scanSeqRef.current += 1;
        if (screenRef.current.kind !== "standby") setScreen({ kind: "standby" });
        return;
      }
      void handleCode(row.current_barcode_id, "remote");
    },
    [handleCode],
  );

  const { realtime, pollOk, markSeen } = useTvState({ onRow, onNotFound: showNotFound });
  markSeenRef.current = markSeen;

  useBarcodeScanner({ onScan: (code) => void handleCode(code, "usb") });

  // --- Return to standby ---------------------------------------------------
  const goIdle = useCallback(() => {
    scanSeqRef.current += 1;
    setScreen({ kind: "standby" });
    // Conditional write: if a phone scanned in the last few ms, don't clobber it.
    resetTv(latestUpdatedAtRef.current)
      .then((row) => {
        if (row) {
          markSeenRef.current(row);
          latestUpdatedAtRef.current = row.updated_at;
        }
      })
      .catch((err) => console.warn("[tv] reset failed", err));
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (screen.kind === "transition") {
      const { id, product } = screen;
      timer = setTimeout(() => {
        setScreen((s) =>
          s.kind === "transition" && s.id === id
            ? { kind: "product", id, product, deadline: Date.now() + PRODUCT_DISPLAY_MS, rescan: 0 }
            : s,
        );
      }, TRANSITION_MS);
    } else if (screen.kind === "product") {
      timer = setTimeout(goIdle, Math.max(0, screen.deadline - Date.now()));
    } else if (screen.kind === "not_found") {
      timer = setTimeout(goIdle, NOT_FOUND_MS);
    }
    return () => clearTimeout(timer);
  }, [screen, goIdle]);

  // --- Kiosk niceties --------------------------------------------------------
  useEffect(() => {
    const blockMenu = (e: MouseEvent) => e.preventDefault();
    const goFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener("contextmenu", blockMenu);
    window.addEventListener("pointerdown", goFullscreen);
    window.focus();
    return () => {
      window.removeEventListener("contextmenu", blockMenu);
      window.removeEventListener("pointerdown", goFullscreen);
    };
  }, []);

  return (
    <TvCanvas>
      {/* initial={false}: the first standby render appears instantly on boot.
          Default "sync" mode (not "wait") lets outgoing and incoming screens
          overlap, so a scan never waits for an exit animation to finish. */}
      <AnimatePresence initial={false}>
        {screen.kind === "standby" ? (
          <StandbyScreen key="standby" realtime={realtime} pollOk={pollOk} productCount={productCount} />
        ) : null}
        {screen.kind === "transition" ? (
          <ScanTransition key={`transition-${screen.id}`} code={screen.product.barcode_id} />
        ) : null}
        {screen.kind === "product" ? (
          <ProductScreen
            key={`product-${screen.id}`}
            product={screen.product}
            deadline={screen.deadline}
            durationMs={PRODUCT_DISPLAY_MS}
            rescanCount={screen.rescan}
          />
        ) : null}
        {screen.kind === "not_found" ? <NotFoundScreen key={`not-found-${screen.id}`} code={screen.code} /> : null}
      </AnimatePresence>
    </TvCanvas>
  );
}
