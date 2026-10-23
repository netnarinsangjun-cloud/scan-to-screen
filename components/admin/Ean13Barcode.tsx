import { ean13Pattern, isGuardModule } from "@/lib/ean13";

const QUIET_LEFT = 11;
const QUIET_RIGHT = 7;
const WIDTH = QUIET_LEFT + 95 + QUIET_RIGHT;
const BAR_H = 58;
const GUARD_H = 64;
const HEIGHT = 74;

/**
 * Printable EAN-13 barcode as crisp SVG (1 unit = 1 module).
 * Pass a code already checked with `isValidEan13`.
 */
export function Ean13Barcode({ code, className = "" }: { code: string; className?: string }) {
  const pattern = ean13Pattern(code);

  // Merge adjacent dark modules into single rects: fewer nodes, no hairline gaps.
  const bars: { x: number; w: number; guard: boolean }[] = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== "1") continue;
    const guard = isGuardModule(i);
    const last = bars[bars.length - 1];
    if (last && last.x + last.w === QUIET_LEFT + i && last.guard === guard) last.w += 1;
    else bars.push({ x: QUIET_LEFT + i, w: 1, guard });
  }

  const digit = (ch: string | undefined, x: number) => (
    <text x={x} y={HEIGHT - 1} fontSize={9} textAnchor="middle" fontFamily="ui-monospace, Menlo, Consolas, monospace" fill="#000">
      {ch}
    </text>
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`EAN-13 ${code}`}
    >
      <rect width={WIDTH} height={HEIGHT} fill="#fff" />
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={b.guard ? GUARD_H : BAR_H} fill="#000" />
      ))}
      {digit(code[0], QUIET_LEFT - 5)}
      {code
        .slice(1, 7)
        .split("")
        .map((c, i) => (
          <g key={`l${i}`}>{digit(c, QUIET_LEFT + 3 + i * 7 + 3.5)}</g>
        ))}
      {code
        .slice(7)
        .split("")
        .map((c, i) => (
          <g key={`r${i}`}>{digit(c, QUIET_LEFT + 50 + i * 7 + 3.5)}</g>
        ))}
    </svg>
  );
}
