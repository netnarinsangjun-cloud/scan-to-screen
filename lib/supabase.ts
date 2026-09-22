import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TV_STATE_ID } from "./config";
import type { Database, Product, ProductInput, TvState } from "./types";

export type { Database, Product, ProductInput, TvState } from "./types";

export type BoothClient = SupabaseClient<Database>;

let client: BoothClient | null = null;

/**
 * Lazily-created browser singleton. Created on first use (inside effects /
 * handlers) rather than at module load, so `next build` never needs the env
 * vars during prerendering and there is exactly one WebSocket per tab.
 */
export function getSupabase(): BoothClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }

  client = createClient<Database>(url, anonKey, {
    // Sessions only exist for /admin (magic-link sign-in). /tv and /scanner stay
    // anonymous, so no refresh timers run on the kiosk.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    realtime: {
      params: { eventsPerSecond: 20 },
      // Short heartbeat so a dead socket is detected quickly on booth Wi-Fi.
      heartbeatIntervalMs: 15_000,
    },
  });
  return client;
}

const PRODUCT_COLUMNS = "id, barcode_id, title, description, price, image_url, video_url, created_at";
const TV_COLUMNS = "id, current_barcode_id, updated_at";

function normaliseProduct(p: Product): Product {
  // numeric can come back as a string depending on the PostgREST config.
  return { ...p, price: p.price === null ? null : Number(p.price) };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normaliseProduct);
}

export async function fetchProduct(barcode: string): Promise<Product | null> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("barcode_id", barcode)
    .maybeSingle();
  if (error) throw error;
  return data ? normaliseProduct(data) : null;
}

export async function fetchTvState(): Promise<TvState | null> {
  const { data, error } = await getSupabase()
    .from("tv_state")
    .select(TV_COLUMNS)
    .eq("id", TV_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Put a (known) product on the TV. `updatedAt` lets the caller pre-register the echo. */
export async function pushBarcode(barcode: string, updatedAt = new Date().toISOString()): Promise<TvState> {
  const { data, error } = await getSupabase()
    .from("tv_state")
    .update({ current_barcode_id: barcode, updated_at: updatedAt })
    .eq("id", TV_STATE_ID)
    .select(TV_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Return the TV to idle. When `expectedUpdatedAt` is given the write is
 * conditional (optimistic concurrency): if a phone scanned something in the
 * meantime, the reset is a no-op and `null` is returned.
 */
export async function resetTv(
  expectedUpdatedAt?: string | null,
  updatedAt = new Date().toISOString(),
): Promise<TvState | null> {
  let query = getSupabase()
    .from("tv_state")
    .update({ current_barcode_id: null, updated_at: updatedAt })
    .eq("id", TV_STATE_ID);
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select(TV_COLUMNS).maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Admin back office
// ---------------------------------------------------------------------------

export const MEDIA_BUCKET = "product-media";

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_admin");
  if (error) throw error;
  return data === true;
}

export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  const query = id
    ? getSupabase().from("products").update(input).eq("id", id)
    : getSupabase().from("products").insert(input);
  const { data, error } = await query.select(PRODUCT_COLUMNS).single();
  if (error) throw error;
  return normaliseProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) throw error;
}

/** Insert-or-update many products by barcode (CSV import). */
export async function upsertProducts(rows: ProductInput[]): Promise<number> {
  const { data, error } = await getSupabase()
    .from("products")
    .upsert(rows, { onConflict: "barcode_id" })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/** Upload an image/video to the public media bucket and return its public URL. */
export async function uploadMedia(file: Blob, extension: string): Promise<string> {
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const storage = getSupabase().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(path, file, {
    cacheControl: "31536000", // file names are unique, so cache forever
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}
