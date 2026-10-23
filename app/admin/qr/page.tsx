"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Ean13Barcode } from "@/components/admin/Ean13Barcode";
import { isValidEan13 } from "@/lib/ean13";
import { formatBaht } from "@/lib/format";
import { fetchProducts } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Card = Product & { qr: string };

/**
 * Printable sheet: an EAN-13 barcode (for USB laser / imager scanners) and a QR
 * code (for the phone scanner) per product.
 * Optional `?prefix=200` limits the sheet to barcodes starting with that prefix.
 */
export default function QrSheetPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const wanted = new URLSearchParams(window.location.search).get("prefix")?.trim() ?? "";
    setPrefix(wanted);
    (async () => {
      try {
        const products = (await fetchProducts()).filter((p) => p.barcode_id.startsWith(wanted));
        const withQr = await Promise.all(
          products.map(async (p) => ({
            ...p,
            qr: await QRCode.toDataURL(p.barcode_id, { margin: 1, width: 360, errorCorrectionLevel: "M" }),
          })),
        );
        if (!cancelled) setCards(withQr);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="qr-sheet min-h-dvh bg-white px-6 py-8 text-black">
      <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            บาร์โค้ด / QR สินค้า ({cards.length}){prefix ? ` · ขึ้นต้นด้วย ${prefix}` : ""}
          </h1>
          <p className="text-sm text-neutral-600">
            บาร์โค้ดแท่งสำหรับเครื่องสแกน USB · QR สำหรับหน้า /scanner บนมือถือ · พิมพ์แบบ 100% (ไม่ย่อ) เพื่อให้สแกนง่าย
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="h-12 rounded-full bg-crimson-500 px-6 font-semibold text-white">
          พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>
      {error ? <p className="mx-auto max-w-5xl text-red-600">{error}</p> : null}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
        {cards.map((c) => (
          <div key={c.id} className="flex break-inside-avoid flex-col items-center rounded-xl border border-neutral-300 p-4 text-center">
            <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">{c.title}</p>
            <p className="text-sm font-bold text-crimson-500">{formatBaht(c.price)}</p>
            {isValidEan13(c.barcode_id) ? (
              // ~45 mm wide when printed at 100 %: comfortably above EAN-13 minimum size.
              <Ean13Barcode code={c.barcode_id} className="mt-3 h-auto w-[170px]" />
            ) : (
              <p className="mt-3 font-mono text-xs tracking-wider text-neutral-600">{c.barcode_id}</p>
            )}
            <img src={c.qr} alt={`QR ${c.barcode_id}`} className="mt-2 h-24 w-24" />
          </div>
        ))}
      </div>
    </main>
  );
}
