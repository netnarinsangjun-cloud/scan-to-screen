/** Minimal EAN-13 encoder: validates a code and returns its 95-module bar pattern. */

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
// Parity of the left half is chosen by the first digit (which is not drawn as bars).
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

/** 95 characters of "1" (bar) / "0" (space). Assumes a valid EAN-13. */
export function ean13Pattern(code: string): string {
  const d = code.split("").map(Number);
  const parity = PARITY[d[0] ?? 0] ?? PARITY[0]!;
  let out = "101";
  for (let i = 1; i <= 6; i++) {
    const table = parity[i - 1] === "L" ? L : G;
    out += table[d[i] ?? 0];
  }
  out += "01010";
  for (let i = 7; i <= 12; i++) out += R[d[i] ?? 0];
  return out + "101";
}

/** Module indexes of the start, centre and end guard bars (drawn taller). */
export function isGuardModule(index: number): boolean {
  return index < 3 || (index >= 45 && index < 50) || index >= 92;
}
