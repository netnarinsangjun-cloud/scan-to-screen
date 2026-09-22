"use client";

import type { IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState, type RefObject } from "react";

export type QrScannerState = "idle" | "starting" | "scanning" | "error";

interface Options {
  enabled: boolean;
  onDecode: (text: string) => void;
  /** Ignore the same code if it is read again within this window. */
  debounceMs?: number;
}

interface Result {
  state: QrScannerState;
  error: string | null;
}

function describeCameraError(err: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "กล้องต้องใช้ผ่าน HTTPS กรุณาเปิดหน้านี้ผ่านลิงก์ Vercel (หรือ localhost)";
  }
  const name = err instanceof Error || err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์ หรือกรอกบาร์โค้ดเองด้านล่าง";
    case "NotFoundError":
    case "OverconstrainedError":
      return "ไม่พบกล้องที่ใช้งานได้ในอุปกรณ์นี้ กรุณากรอกบาร์โค้ดเองด้านล่าง";
    case "NotReadableError":
      return "กล้องถูกใช้งานโดยแอปอื่นอยู่ กรุณาปิดแอปนั้นแล้วลองใหม่";
    default:
      return err instanceof Error ? err.message : "เปิดกล้องไม่สำเร็จ";
  }
}

/**
 * Camera barcode / QR reader built on @zxing/browser.
 * Requests the rear camera, decodes continuously, and de-duplicates repeated
 * reads of the same code within `debounceMs` (the camera sees the same code
 * on many consecutive frames).
 */
export function useQrScanner(
  videoRef: RefObject<HTMLVideoElement>,
  { enabled, onDecode, debounceMs = 2_000 }: Options,
): Result {
  const [state, setState] = useState<QrScannerState>("idle");
  const [error, setError] = useState<string | null>(null);

  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;
  const lastRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) {
      setState("idle");
      return;
    }

    let cancelled = false;
    let controls: IScannerControls | null = null;
    setState("starting");
    setError(null);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException("mediaDevices unavailable", window.isSecureContext ? "NotFoundError" : "SecurityError");
        }
        // Dynamic import keeps zxing (~400 kB) out of the /tv bundle and off the server.
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        if (cancelled) return;

        const hints = new Map<import("@zxing/library").DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.DATA_MATRIX,
        ]);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 250,
        });

        const started = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result) => {
            if (!result || cancelled) return;
            const text = result.getText().trim();
            if (!text) return;
            const now = Date.now();
            if (text === lastRef.current.text && now - lastRef.current.at < debounceMs) return;
            lastRef.current = { text, at: now };
            onDecodeRef.current(text);
          },
        );

        if (cancelled) {
          started.stop();
          return;
        }
        controls = started;
        setState("scanning");
      } catch (err) {
        if (cancelled) return;
        console.warn("[scanner] camera error", err);
        setError(describeCameraError(err));
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
      controls = null;
    };
  }, [enabled, debounceMs, videoRef]);

  return { state, error };
}
