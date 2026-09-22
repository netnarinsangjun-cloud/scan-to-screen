"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { formatBaht } from "@/lib/format";
import { fetchProducts } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Card = Product & { qr: string };

/** Printable sheet of QR codes (one per product) for testing and booth labels. */
export default function QrSheetPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const products = await fetchProducts();
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
          <h1 className="text-2xl font-bold">QR สินค้าทั้งหมด ({cards.length})</h1>
          <p className="text-sm text-neutral-600">สแกนด้วยหน้า /scanner บนมือถือ หรือเครื่องสแกนที่อ่าน QR ได้</p>
        </div>
        <button type="button" onClick={() => window.print()} className="h-12 bg-[#DC143C] px-6 font-semibold text-white">
          พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>
      {error ? <p className="mx-auto max-w-5xl text-red-600">{error}</p> : null}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
        {cards.map((c) => (
          <div key={c.id} className="flex break-inside-avoid flex-col items-center border border-neutral-300 p-4 text-center">
            <img src={c.qr} alt={`QR ${c.barcode_id}`} className="h-40 w-40" />
            <p className="mt-2 line-clamp-2 text-sm font-semibold">{c.title}</p>
            <p className="font-mono text-xs tracking-wider text-neutral-600">{c.barcode_id}</p>
            <p className="text-sm font-bold text-[#DC143C]">{formatBaht(c.price)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
