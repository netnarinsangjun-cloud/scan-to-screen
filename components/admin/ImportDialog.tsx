"use client";

import { useState } from "react";
import { csvToProducts, parseCsv, productsToCsv } from "@/lib/csv";
import { upsertProducts } from "@/lib/supabase";
import type { ProductInput } from "@/lib/types";
import { Modal } from "./Modal";

interface Props {
  existingBarcodes: Set<string>;
  onClose: () => void;
  onImported: (count: number) => void;
}

export function downloadCsv(filename: string, rows: ProductInput[]): void {
  const blob = new Blob([productsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const TEMPLATE_ROWS: ProductInput[] = [
  {
    barcode_id: "8851234567890",
    title: "ตัวอย่างสินค้า",
    description: "คำอธิบายสินค้า (ลบแถวนี้แล้วใส่สินค้าจริง)",
    price: 1990,
    image_url: "https://example.com/product.jpg",
    video_url: null,
  },
];

export function ImportDialog({ existingBarcodes, onClose, onImported }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ProductInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const updates = rows.filter((r) => existingBarcodes.has(r.barcode_id)).length;

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setFailure(null);
    const result = csvToProducts(parseCsv(await file.text()));
    setRows(result.rows);
    setErrors(result.errors);
  };

  const runImport = async () => {
    setBusy(true);
    setFailure(null);
    try {
      onImported(await upsertProducts(rows));
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="นำเข้าสินค้าจากไฟล์ CSV"
      onClose={busy ? () => undefined : onClose}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {failure ? <p className="text-sm text-scarlet-400">{failure}</p> : <span />}
          <div className="flex gap-3">
            <button type="button" className="btn-ghost h-12 flex-1 px-5 text-base sm:flex-none" onClick={onClose} disabled={busy}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn-primary h-12 flex-1 px-5 text-base sm:flex-none"
              disabled={busy || rows.length === 0}
              onClick={() => void runImport()}
            >
              {busy ? "กำลังนำเข้า…" : `นำเข้า ${rows.length} รายการ`}
            </button>
          </div>
        </div>
      }
    >
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-graphite-200">
        <li>
          ดาวน์โหลด{" "}
          <button type="button" className="text-crimson-200 underline" onClick={() => downloadCsv("products-template.csv", TEMPLATE_ROWS)}>
            ไฟล์ตัวอย่าง
          </button>{" "}
          แล้วเปิดด้วย Excel หรือ Google Sheets
        </li>
        <li>
          กรอกคอลัมน์ <code className="text-crimson-200">barcode_id, title, description, price, image_url, video_url</code> (สองคอลัมน์แรกบังคับ)
        </li>
        <li>บันทึกเป็น <b>CSV UTF-8</b> เพื่อให้ภาษาไทยไม่เพี้ยน แล้วเลือกไฟล์ด้านล่าง</li>
      </ol>

      <label className="mt-5 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-crimson-500/60 bg-graphite-800 text-center hover:border-scarlet-500">
        <span className="text-sm text-graphite-200">{fileName ?? "แตะเพื่อเลือกไฟล์ .csv"}</span>
        {fileName ? <span className="text-xs text-graphite-400">แตะเพื่อเปลี่ยนไฟล์</span> : null}
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void readFile(e.target.files?.[0])} />
      </label>

      {fileName ? (
        <div className="mt-5 space-y-3 text-sm">
          <p className="text-graphite-200">
            พร้อมนำเข้า <b className="text-white">{rows.length}</b> รายการ — เพิ่มใหม่ {rows.length - updates} · อัปเดตของเดิม{" "}
            {updates} (จับคู่ด้วยบาร์โค้ด)
          </p>
          {errors.length > 0 ? (
            <div className="border border-scarlet-500/50 bg-crimson-900/40 p-3">
              <p className="mb-1 font-medium text-scarlet-400">ข้ามไป {errors.length} แถว:</p>
              <ul className="list-disc space-y-0.5 pl-5 text-graphite-200">
                {errors.slice(0, 8).map((e) => (
                  <li key={e}>{e}</li>
                ))}
                {errors.length > 8 ? <li>และอีก {errors.length - 8} แถว</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
