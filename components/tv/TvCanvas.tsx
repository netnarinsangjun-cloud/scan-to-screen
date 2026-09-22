"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/config";

/**
 * Fixed 1920×1080 design canvas, uniformly scaled (letterboxed) to whatever
 * the actual display is. Everything inside is authored in real pixels, so the
 * layout never reflows and there is zero layout jank when the window resizes.
 */
export function TvCanvas({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="tv-root flex items-center justify-center">
      <div
        className="relative shrink-0 overflow-hidden bg-void"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
