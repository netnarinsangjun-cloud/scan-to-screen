"use client";

import { useState } from "react";
import { Modal } from "./Modal";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** In-app confirmation (no window.confirm, which blocks the page). */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title={title}
      onClose={busy ? () => undefined : onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-ghost h-12 px-5 text-base" onClick={onClose} disabled={busy}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn-primary h-12 px-5 text-base"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "กำลังดำเนินการ…" : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="leading-relaxed text-graphite-200">{message}</p>
    </Modal>
  );
}
