"use client";

import { useRef } from "react";
import { useQrScanner } from "@/hooks/useQrScanner";
import { successFeedback, unlockAudio } from "@/lib/feedback";
import { Modal } from "./Modal";

interface Props {
  onResult: (code: string) => void;
  onClose: () => void;
}

/** Camera barcode reader used to fill the barcode field in the product editor. */
export function BarcodeScanModal({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, error } = useQrScanner(videoRef, {
    enabled: true,
    onDecode: (text) => {
      unlockAudio();
      successFeedback();
      onResult(text);
    },
  });

  return (
    <Modal title="สแกนบาร์โค้ดด้วยกล้อง" onClose={onClose}>
      <div className="relative aspect-square w-full overflow-hidden border border-crimson-500/40 bg-black">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline autoPlay />
        <div className="pointer-events-none absolute inset-[14%]">
          <div className="hud-corners absolute inset-0" />
          {state === "scanning" ? (
            <div className="absolute inset-0 animate-laser" style={{ ["--laser-travel" as string]: "100%" }}>
              <div className="h-[2px] w-full bg-scarlet-500 shadow-glow" />
            </div>
          ) : null}
        </div>
        {state !== "scanning" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-void/80 p-6 text-center text-sm">
            {error ? <p className="text-scarlet-400">{error}</p> : <p className="animate-pulse text-crimson-200">กำลังเปิดกล้อง…</p>}
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-center text-sm text-graphite-300">เล็งบาร์โค้ดหรือ QR ให้อยู่ในกรอบ ระบบจะใส่เลขให้อัตโนมัติ</p>
    </Modal>
  );
}
