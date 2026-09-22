"use client";

import { useEffect, useRef } from "react";

interface Options {
  /** Called with the full scanned string when the scanner sends Enter. */
  onScan: (code: string) => void;
  /** Max gap between keystrokes before the buffer is considered human typing. */
  maxGapMs?: number;
  /** Ignore commits shorter than this (a human pressing a key then Enter). */
  minLength?: number;
  enabled?: boolean;
}

/**
 * Resolve the character from the *physical* key (`event.code`) for digits and
 * letters, so scans still read correctly when the OS keyboard layout is Thai
 * (where the "8" key would otherwise produce "ค"). Other keys fall back to `event.key`.
 */
function keyToChar(event: KeyboardEvent): string | null {
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(event.code);
  if (digit?.[1] && !event.shiftKey) return digit[1];
  const letter = /^Key([A-Z])$/.exec(event.code);
  if (letter?.[1]) return event.shiftKey || event.getModifierState("CapsLock") ? letter[1] : letter[1].toLowerCase();
  return event.key.length === 1 ? event.key : null;
}

/**
 * USB "keyboard wedge" barcode scanner listener.
 *
 * Scanners type the code at machine speed (typically 2–15 ms per character)
 * and finish with Enter. We buffer printable keys globally and reset the
 * buffer whenever the gap between two keys exceeds `maxGapMs`, which filters
 * out a human typing on the same keyboard. No <input> element is needed.
 */
export function useBarcodeScanner({ onScan, maxGapMs = 50, minLength = 3, enabled = true }: Options): void {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyAt = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Modifier chords (Ctrl+R, Cmd+Q, Alt+Tab…) are never scanner input.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.isComposing) return;

      const now = performance.now();
      const gap = now - lastKeyAt;
      lastKeyAt = now;

      if (event.key === "Enter") {
        // Enter must also arrive at scanner speed, otherwise it's a human.
        const code = gap <= maxGapMs ? buffer : "";
        buffer = "";
        if (code.length >= minLength) {
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      // Shift, CapsLock, Tab, arrows, F-keys etc. produce no character.
      const char = keyToChar(event);
      if (char === null) return;

      if (gap > maxGapMs) buffer = "";
      buffer += char;
      // Stop the browser from doing anything with the keystroke (e.g. space scroll, "/" quick find).
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled, maxGapMs, minLength]);
}
