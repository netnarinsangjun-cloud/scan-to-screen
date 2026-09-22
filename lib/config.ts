/** Single place for booth-wide timing constants. */
export const TV_STATE_ID = 1;

/** How long a product stays on screen after the most recent scan. */
export const PRODUCT_DISPLAY_MS = 30_000;

/** Scan-transition length. Must stay ≤ 800 ms per spec. */
export const TRANSITION_MS = 650;

/** How long "PRODUCT NOT FOUND" stays up before returning to standby. */
export const NOT_FOUND_MS = 3_000;

/** Fallback polling interval for tv_state when Realtime misbehaves. */
export const POLL_INTERVAL_MS = 5_000;

/** Product catalogue refresh (picks up products added mid-event). */
export const PRODUCT_REFRESH_MS = 60_000;

/** Realtime channel shared by /tv and /scanner (postgres_changes + broadcast). */
export const REALTIME_CHANNEL = "booth-tv-state";

/** Broadcast event used to push "unknown barcode" from a phone to the TV. */
export const NOT_FOUND_EVENT = "not_found";

/** Broadcast event sent by /admin after any catalogue change; the TV reloads products. */
export const CATALOG_CHANGED_EVENT = "catalog_changed";

/** Native design canvas of the TV. */
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const BOOTH_LABEL = "SCAN//TO//SCREEN";

/**
 * Admins sign in with a username + password. Supabase Auth needs an email, so a
 * bare username maps to `<username>@scan-to-screen.local` (never emailed).
 */
export const ADMIN_EMAIL_DOMAIN = "scan-to-screen.local";

export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${ADMIN_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string | null): string {
  if (!email) return "";
  return email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`) ? email.slice(0, -(ADMIN_EMAIL_DOMAIN.length + 1)) : email;
}
