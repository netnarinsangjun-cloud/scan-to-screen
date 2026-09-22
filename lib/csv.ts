import type { ProductInput } from "./types";

export const CSV_COLUMNS = ["barcode_id", "title", "description", "price", "image_url", "video_url"] as const;

/** RFC 4180-ish parser: handles quoted fields, escaped quotes, CRLF and a UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export interface CsvImportResult {
  rows: ProductInput[];
  errors: string[];
}

const emptyToNull = (value: string | undefined): string | null => {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
};

/** Turn parsed CSV into validated product rows. Row numbers in errors are 1-based incl. header. */
export function csvToProducts(table: string[][]): CsvImportResult {
  const errors: string[] = [];
  const [header, ...body] = table;
  if (!header) return { rows: [], errors: ["ไฟล์ว่างเปล่า"] };

  const index = new Map(header.map((h, i) => [h.trim().toLowerCase(), i]));
  for (const required of ["barcode_id", "title"]) {
    if (!index.has(required)) errors.push(`ไม่พบคอลัมน์ "${required}" ในแถวหัวตาราง`);
  }
  if (errors.length) return { rows: [], errors };

  const cell = (r: string[], name: string) => {
    const i = index.get(name);
    return i === undefined ? undefined : r[i];
  };

  const seen = new Set<string>();
  const rows: ProductInput[] = [];
  body.forEach((r, n) => {
    const line = n + 2;
    const barcode = (cell(r, "barcode_id") ?? "").trim();
    const title = (cell(r, "title") ?? "").trim();
    if (!barcode) return errors.push(`แถว ${line}: ไม่มี barcode_id`);
    if (!title) return errors.push(`แถว ${line}: ไม่มี title`);
    if (seen.has(barcode)) return errors.push(`แถว ${line}: บาร์โค้ด ${barcode} ซ้ำในไฟล์`);

    const rawPrice = (cell(r, "price") ?? "").replace(/[฿,\s]/g, "");
    let price: number | null = null;
    if (rawPrice !== "") {
      price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0) return errors.push(`แถว ${line}: ราคา "${cell(r, "price")}" ไม่ถูกต้อง`);
    }

    seen.add(barcode);
    rows.push({
      barcode_id: barcode,
      title,
      description: emptyToNull(cell(r, "description")),
      price,
      image_url: emptyToNull(cell(r, "image_url")),
      video_url: emptyToNull(cell(r, "video_url")),
    });
    return undefined;
  });

  return { rows, errors };
}

const escapeCell = (value: string | number | null) => {
  const s = value === null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Build a CSV (with BOM so Excel opens Thai text correctly). */
export function productsToCsv(rows: ProductInput[]): string {
  const lines = [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => escapeCell(r[c])).join(","))];
  return "﻿" + lines.join("\r\n");
}
