const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 12900 → "฿12,900" */
export function formatBaht(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "PRICE ON REQUEST";
  const value = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(value)) return "PRICE ON REQUEST";
  return thb.format(value);
}

/** Scanners sometimes append whitespace / control chars; normalise before lookup. */
export function normaliseBarcode(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code > 0x1f && code !== 0x7f) out += ch;
  }
  return out.trim();
}

/** Parse a timestamptz string into epoch ms (NaN-safe). */
export function toMs(ts: string | null | undefined): number {
  if (!ts) return 0;
  const ms = Date.parse(ts);
  return Number.isNaN(ms) ? 0 : ms;
}
