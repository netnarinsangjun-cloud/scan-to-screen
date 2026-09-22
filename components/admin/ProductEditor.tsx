"use client";

import { AnimatePresence } from "framer-motion";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { formatBaht, normaliseBarcode } from "@/lib/format";
import { extensionOf, prepareImage } from "@/lib/image";
import { saveProduct, uploadMedia } from "@/lib/supabase";
import type { Product, ProductInput } from "@/lib/types";
import { BarcodeScanModal } from "./BarcodeScanModal";
import { Modal } from "./Modal";

interface Props {
  /** Product to edit, or null to create. */
  product: Product | null;
  /** Pre-filled barcode when creating from a scan. */
  initialBarcode?: string;
  onClose: () => void;
  onSaved: (product: Product, created: boolean) => void;
}

const MAX_VIDEO_MB = 50;

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-graphite-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-graphite-400">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "h-12 w-full border border-graphite-500 bg-graphite-800 px-3 text-base text-white outline-none placeholder:text-graphite-500 focus:border-scarlet-500 focus:shadow-glow-sm";

function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string; statusCode?: string };
  if (e?.code === "23505") return "บาร์โค้ดนี้มีสินค้าอื่นใช้อยู่แล้ว";
  if (e?.code === "42501" || e?.statusCode === "403") return "บัญชีนี้ไม่มีสิทธิ์แก้ไขสินค้า";
  return e?.message ?? "บันทึกไม่สำเร็จ";
}

export function ProductEditor({ product, initialBarcode = "", onClose, onSaved }: Props) {
  const [barcode, setBarcode] = useState(product?.barcode_id ?? initialBarcode);
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(product?.video_url ?? "");
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const parsedPrice = price.trim() === "" ? null : Number(price.replace(/[฿,\s]/g, ""));

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading("image");
    try {
      const { blob, extension } = await prepareImage(file);
      setImageUrl(await uploadMedia(blob, extension));
    } catch (err) {
      setError(`อัปโหลดรูปไม่สำเร็จ: ${describeError(err)}`);
    } finally {
      setUploading(null);
    }
  };

  const handleVideo = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`วิดีโอต้องไม่เกิน ${MAX_VIDEO_MB} MB`);
      return;
    }
    setUploading("video");
    try {
      setVideoUrl(await uploadMedia(file, extensionOf(file)));
    } catch (err) {
      setError(`อัปโหลดวิดีโอไม่สำเร็จ: ${describeError(err)}`);
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = normaliseBarcode(barcode);
    if (!code) return setError("กรุณาใส่บาร์โค้ด");
    if (!title.trim()) return setError("กรุณาใส่ชื่อสินค้า");
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) return setError("ราคาไม่ถูกต้อง");

    const input: ProductInput = {
      barcode_id: code,
      title: title.trim(),
      description: description.trim() || null,
      price: parsedPrice,
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    };

    setSaving(true);
    try {
      const saved = await saveProduct(input, product?.id);
      onSaved(saved, !product);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploading !== null;

  return (
    <>
      <Modal
        title={product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
        // While the camera dialog is on top, Escape should only close that one.
        onClose={busy || scanOpen ? () => undefined : onClose}
        wide
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {error ? <p className="text-sm text-scarlet-400">{error}</p> : <span />}
            <div className="flex gap-3">
              <button type="button" className="btn-ghost h-12 flex-1 px-5 text-base sm:flex-none" onClick={onClose} disabled={busy}>
                ยกเลิก
              </button>
              <button type="submit" form="product-form" className="btn-primary h-12 flex-1 px-6 text-base sm:flex-none" disabled={busy}>
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        }
      >
        <form id="product-form" onSubmit={submit} className="grid gap-5 md:grid-cols-[1fr_220px]">
          <div className="grid gap-4">
            <Field label="บาร์โค้ด *" hint="ยิงเครื่องสแกน USB ใส่ช่องนี้ได้เลย หรือกดปุ่มกล้อง">
              <div className="flex gap-2">
                <input
                  className={`${inputClass} font-hud tracking-widest`}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    // A USB scanner ends with Enter: move on instead of submitting the form.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      titleRef.current?.focus();
                    }
                  }}
                  placeholder="เช่น 8850001000019"
                  autoComplete="off"
                  autoFocus={!product}
                  inputMode="text"
                />
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="h-12 shrink-0 border border-crimson-500/60 px-4 text-sm font-medium text-crimson-200 hover:bg-crimson-500/15"
                >
                  📷 กล้อง
                </button>
              </div>
            </Field>

            <Field label="ชื่อสินค้า *">
              <input ref={titleRef} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </Field>

            <Field label="รายละเอียด">
              <textarea
                className={`${inputClass} h-28 resize-y py-2 leading-relaxed`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={600}
              />
            </Field>

            <Field label="ราคา (บาท)" hint={parsedPrice !== null && Number.isFinite(parsedPrice) ? `แสดงบนจอ: ${formatBaht(parsedPrice)}` : "เว้นว่างได้ จอจะแสดงว่า PRICE ON REQUEST"}>
              <input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="เช่น 12900" />
            </Field>

            <Field label="วิดีโอพื้นหลัง (ไม่บังคับ)" hint={`MP4/WebM ไม่เกิน ${MAX_VIDEO_MB} MB เล่นแบบปิดเสียงวนซ้ำหลังสินค้า`}>
              <div className="flex gap-2">
                <input className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="วางลิงก์ หรือกดอัปโหลด" />
                <label className="flex h-12 shrink-0 cursor-pointer items-center border border-crimson-500/60 px-4 text-sm font-medium text-crimson-200 hover:bg-crimson-500/15">
                  {uploading === "video" ? "กำลังอัปโหลด…" : "อัปโหลด"}
                  <input type="file" accept="video/mp4,video/webm" className="hidden" disabled={busy} onChange={(e) => void handleVideo(e.target.files?.[0])} />
                </label>
              </div>
            </Field>
          </div>

          {/* Image column */}
          <div className="grid content-start gap-3">
            <span className="text-sm font-medium text-graphite-200">รูปสินค้า</span>
            <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden border border-dashed border-crimson-500/60 bg-graphite-800 hover:border-scarlet-500">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-sm text-graphite-300">แตะเพื่อเลือกรูป หรือถ่ายรูป</span>
              )}
              {uploading === "image" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-void/80 text-sm text-crimson-200">กำลังอัปโหลด…</span>
              ) : imageUrl ? (
                <span className="absolute inset-x-0 bottom-0 bg-void/80 py-1.5 text-center text-xs text-graphite-200 opacity-0 transition group-hover:opacity-100">
                  เปลี่ยนรูป
                </span>
              ) : null}
              <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => void handleImage(e.target.files?.[0])} />
            </label>
            <input className={`${inputClass} h-10 text-sm`} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="หรือวางลิงก์รูป" />
            <p className="text-xs leading-relaxed text-graphite-400">แนะนำรูปสี่เหลี่ยมจัตุรัส ระบบย่อขนาดให้อัตโนมัติ (สูงสุด 1600px)</p>
          </div>
        </form>
      </Modal>

      <AnimatePresence>
        {scanOpen ? (
          <BarcodeScanModal
            onClose={() => setScanOpen(false)}
            onResult={(code) => {
              setBarcode(code);
              setScanOpen(false);
              titleRef.current?.focus();
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
