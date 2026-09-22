"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { downloadCsv, ImportDialog } from "@/components/admin/ImportDialog";
import { LoginPanel } from "@/components/admin/LoginPanel";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { ToastStack, useToasts } from "@/components/scanner/Toasts";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useTvState } from "@/hooks/useTvState";
import { emailToUsername } from "@/lib/config";
import { formatBaht, normaliseBarcode } from "@/lib/format";
import { deleteProduct, fetchProducts, pushBarcode, resetTv } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Dialog =
  | { kind: "none" }
  | { kind: "edit"; product: Product | null; barcode?: string }
  | { kind: "delete"; product: Product }
  | { kind: "import" };

function Dashboard({ email, onSignOut }: { email: string | null; onSignOut: () => Promise<void> }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const { toasts, push: toast, dismiss } = useToasts();
  const { row, realtime, markSeen, broadcastCatalogChanged } = useTvState();

  const load = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      toast("error", "โหลดสินค้าไม่สำเร็จ", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = useCallback(async () => {
    await load();
    void broadcastCatalogChanged(); // TVs reload their catalogue immediately
  }, [load, broadcastCatalogChanged]);

  // Scan with a USB scanner anywhere on the list (not inside a field) to open that product,
  // or start a new one pre-filled with the scanned barcode.
  useBarcodeScanner({
    enabled: dialog.kind === "none",
    onScan: (raw) => {
      const code = normaliseBarcode(raw);
      const existing = products.find((p) => p.barcode_id === code);
      setDialog({ kind: "edit", product: existing ?? null, barcode: existing ? undefined : code });
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.barcode_id.includes(q));
  }, [products, query]);

  const existingBarcodes = useMemo(() => new Set(products.map((p) => p.barcode_id)), [products]);
  const onScreen = row?.current_barcode_id ?? null;

  const showOnTv = async (p: Product) => {
    try {
      markSeen(await pushBarcode(p.barcode_id));
      toast("success", "ส่งขึ้นจอแล้ว", p.title);
    } catch (err) {
      toast("error", "ส่งขึ้นจอไม่สำเร็จ", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-crimson-500/30 pb-5">
        <div>
          <p className="font-hud text-sm font-semibold tracking-[0.4em] text-crimson-400">BACK OFFICE</p>
          <h1 className="neon-text font-display text-2xl font-black tracking-wider sm:text-3xl">จัดการสินค้า</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-graphite-300">
            <span className={`h-2 w-2 rounded-full ${realtime === "live" ? "bg-crimson-500 shadow-glow-sm" : "bg-amber-400"}`} />
            {emailToUsername(email)}
          </span>
          <button type="button" className="border border-graphite-500 px-3 py-2 text-graphite-200 hover:border-crimson-500" onClick={() => void onSignOut()}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* TV status */}
      <section className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-graphite-600 bg-graphite-900/70 px-4 py-3 text-sm">
        <span className="text-graphite-300">
          สถานะจอ:{" "}
          <b className="text-white">
            {onScreen ? `กำลังแสดง · ${products.find((p) => p.barcode_id === onScreen)?.title ?? onScreen}` : "ว่าง (หน้ารอสแกน)"}
          </b>
        </span>
        <div className="flex gap-3">
          {onScreen ? (
            <button
              type="button"
              className="text-crimson-200 underline"
              onClick={async () => {
                const next = await resetTv().catch(() => null);
                if (next) markSeen(next);
              }}
            >
              รีเซ็ตจอ
            </button>
          ) : null}
          <Link href="/tv" target="_blank" className="text-crimson-200 underline">
            เปิดจอทีวี ↗
          </Link>
        </div>
      </section>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า หรือบาร์โค้ด…"
          className="h-12 flex-1 border border-graphite-500 bg-graphite-800 px-4 text-base text-white outline-none placeholder:text-graphite-500 focus:border-scarlet-500"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button type="button" className="btn-primary h-12 px-5 text-sm tracking-[0.1em]" onClick={() => setDialog({ kind: "edit", product: null })}>
            + เพิ่มสินค้า
          </button>
          <button type="button" className="btn-ghost h-12 px-4 text-sm tracking-[0.1em]" onClick={() => setDialog({ kind: "import" })}>
            นำเข้า CSV
          </button>
          <button
            type="button"
            className="btn-ghost h-12 px-4 text-sm tracking-[0.1em]"
            disabled={products.length === 0}
            onClick={() => downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, products)}
          >
            ส่งออก CSV
          </button>
          <Link href="/admin/qr" target="_blank" className="btn-ghost h-12 px-4 text-sm tracking-[0.1em]">
            พิมพ์ QR
          </Link>
        </div>
      </div>
      <p className="mt-2 text-xs text-graphite-400">
        เคล็ดลับ: ยิงเครื่องสแกน USB ที่หน้านี้ได้เลย (โดยไม่ต้องคลิกช่องใด) ระบบจะเปิดสินค้านั้นขึ้นมาแก้ไข หรือสร้างสินค้าใหม่พร้อมบาร์โค้ดให้
      </p>

      {/* List */}
      <p className="mt-6 text-sm text-graphite-300">
        {loading ? "กำลังโหลด…" : `ทั้งหมด ${products.length} รายการ${query ? ` · ตรงกับการค้นหา ${filtered.length}` : ""}`}
      </p>
      <ul className="mt-3 grid gap-3">
        <AnimatePresence initial={false}>
          {filtered.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col gap-3 border bg-graphite-900/80 p-3 sm:flex-row sm:items-center ${onScreen === p.barcode_id ? "border-scarlet-500 shadow-glow-sm" : "border-graphite-600"}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden bg-graphite-800">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {p.title}
                    {onScreen === p.barcode_id ? <span className="ml-2 text-xs text-scarlet-400">● บนจอ</span> : null}
                  </p>
                  <p className="font-hud text-sm tracking-widest text-graphite-400">{p.barcode_id}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="font-display text-lg font-bold text-crimson-200 sm:w-32 sm:text-right">{formatBaht(p.price)}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void showOnTv(p)} className="h-10 border border-crimson-500/60 px-3 text-sm text-crimson-200 hover:bg-crimson-500/15">
                    ขึ้นจอ
                  </button>
                  <button type="button" onClick={() => setDialog({ kind: "edit", product: p })} className="h-10 border border-graphite-500 px-3 text-sm text-graphite-100 hover:border-crimson-500">
                    แก้ไข
                  </button>
                  <button type="button" onClick={() => setDialog({ kind: "delete", product: p })} className="h-10 border border-graphite-600 px-3 text-sm text-graphite-400 hover:border-scarlet-500 hover:text-scarlet-400">
                    ลบ
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {!loading && products.length === 0 ? (
        <p className="mt-10 text-center text-graphite-400">ยังไม่มีสินค้า กด “+ เพิ่มสินค้า” หรือ “นำเข้า CSV” เพื่อเริ่มต้น</p>
      ) : null}

      {/* Dialogs */}
      <AnimatePresence>
        {dialog.kind === "edit" ? (
          <ProductEditor
            key="edit"
            product={dialog.product}
            initialBarcode={dialog.barcode}
            onClose={() => setDialog({ kind: "none" })}
            onSaved={(saved, created) => {
              setDialog({ kind: "none" });
              toast("success", created ? "เพิ่มสินค้าแล้ว" : "บันทึกการแก้ไขแล้ว", saved.title);
              void changed();
            }}
          />
        ) : null}
        {dialog.kind === "delete" ? (
          <ConfirmDialog
            key="delete"
            title="ลบสินค้า"
            message={`ลบ “${dialog.product.title}” (${dialog.product.barcode_id}) ออกจากระบบ? การลบนี้ย้อนกลับไม่ได้ ถ้าสินค้านี้กำลังแสดงบนจอ จอจะกลับหน้ารอสแกน`}
            confirmLabel="ลบสินค้า"
            onClose={() => setDialog({ kind: "none" })}
            onConfirm={async () => {
              const target = dialog.product;
              try {
                await deleteProduct(target.id);
                toast("info", "ลบสินค้าแล้ว", target.title);
                setDialog({ kind: "none" });
                void changed();
              } catch (err) {
                toast("error", "ลบไม่สำเร็จ", err instanceof Error ? err.message : undefined);
              }
            }}
          />
        ) : null}
        {dialog.kind === "import" ? (
          <ImportDialog
            key="import"
            existingBarcodes={existingBarcodes}
            onClose={() => setDialog({ kind: "none" })}
            onImported={(count) => {
              setDialog({ kind: "none" });
              toast("success", "นำเข้าเรียบร้อย", `${count} รายการ`);
              void changed();
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  const { status, email, error, signIn, signOut } = useAdminSession();

  return (
    <main className="min-h-dvh bg-void bg-hud-grid bg-grid">
      {status === "admin" ? (
        <Dashboard email={email} onSignOut={signOut} />
      ) : (
        <div className="flex min-h-dvh items-center justify-center px-4 py-10">
          {status === "loading" ? (
            <p className="animate-pulse font-hud tracking-[0.3em] text-crimson-200">LOADING…</p>
          ) : status === "signed_out" ? (
            <LoginPanel onSignIn={signIn} />
          ) : (
            <div className="hud-panel w-full max-w-md space-y-4 p-8 text-graphite-200">
              <h1 className="font-display text-2xl font-black text-white">
                {status === "not_admin" ? "ไม่มีสิทธิ์เข้าถึง" : "เกิดข้อผิดพลาด"}
              </h1>
              <p>
                {status === "not_admin"
                  ? `บัญชี ${emailToUsername(email)} ยังไม่อยู่ในรายชื่อแอดมิน ติดต่อผู้ดูแลระบบให้เพิ่มบัญชีนี้ในตาราง admins`
                  : error}
              </p>
              <button type="button" className="btn-ghost w-full" onClick={() => void signOut()}>
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
