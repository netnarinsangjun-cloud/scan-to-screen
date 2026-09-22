"use client";

import type { RealtimeChannel, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOT_FOUND_EVENT, POLL_INTERVAL_MS, REALTIME_CHANNEL, TV_STATE_ID } from "@/lib/config";
import { toMs } from "@/lib/format";
import { fetchTvState, getSupabase } from "@/lib/supabase";
import type { RealtimeStatus, TvState } from "@/lib/types";

export type RowSource = "initial" | "realtime" | "poll";

interface Options {
  /**
   * Fired once per *distinct* tv_state value (barcode + updated_at). Duplicate
   * deliveries — Realtime + poll seeing the same row, or the echo of a write
   * registered with `markSeen` — are filtered out.
   */
  onRow?: (row: TvState, source: RowSource) => void;
  /** Fired when a phone broadcasts an unknown barcode. */
  onNotFound?: (code: string) => void;
  pollMs?: number;
}

interface Result {
  row: TvState | null;
  realtime: RealtimeStatus;
  /** True when the most recent poll succeeded (i.e. the DB is reachable). */
  pollOk: boolean;
  /** Register a row we wrote ourselves so its Realtime echo is ignored. */
  markSeen: (row: TvState) => void;
  /** Tell the TV a phone scanned an unknown barcode. */
  broadcastNotFound: (code: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SEEN_LIMIT = 32;

const rowKey = (row: TvState) => `${row.current_barcode_id ?? "-"}@${toMs(row.updated_at)}`;

function remember(seen: string[], key: string): void {
  seen.push(key);
  if (seen.length > SEEN_LIMIT) seen.splice(0, seen.length - SEEN_LIMIT);
}

/**
 * Subscribes to `public.tv_state` via Supabase Realtime with:
 *  - automatic re-subscribe (exponential backoff) on CHANNEL_ERROR / TIMED_OUT / CLOSED
 *  - a 5 s polling fallback that runs continuously (cheap, and catches any
 *    event missed while the socket was silently dead)
 *  - immediate catch-up fetch on (re)subscribe, `online` and tab-visible
 */
export function useTvState({ onRow, onNotFound, pollMs = POLL_INTERVAL_MS }: Options = {}): Result {
  const [row, setRow] = useState<TvState | null>(null);
  const [realtime, setRealtime] = useState<RealtimeStatus>("connecting");
  const [pollOk, setPollOk] = useState(true);

  const onRowRef = useRef(onRow);
  const onNotFoundRef = useRef(onNotFound);
  onRowRef.current = onRow;
  onNotFoundRef.current = onNotFound;

  // Recently seen row keys. A stale poll response (issued before a Realtime
  // event, answered after it) carries an already-seen key and is ignored.
  // Keys are compared by identity, never by timestamp order, because
  // updated_at values come from different devices' clocks.
  const seenRef = useRef<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectNowRef = useRef<() => void>(() => undefined);

  const ingest = useCallback((next: TvState, source: RowSource) => {
    const key = rowKey(next);
    if (seenRef.current.includes(key)) return;
    remember(seenRef.current, key);
    setRow(next);
    onRowRef.current?.(next, source);
  }, []);

  const markSeen = useCallback((next: TvState) => {
    remember(seenRef.current, rowKey(next));
    setRow(next);
  }, []);

  const firstFetchDoneRef = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const data = await fetchTvState();
      setPollOk(true);
      if (data) {
        ingest(data, firstFetchDoneRef.current ? "poll" : "initial");
        firstFetchDoneRef.current = true;
      }
    } catch (err) {
      setPollOk(false);
      console.warn("[tv_state] fetch failed", err);
    }
  }, [ingest]);

  // --- Realtime subscription with auto-resubscribe -------------------------
  useEffect(() => {
    let disposed = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch (err) {
      console.error(err);
      setRealtime("reconnecting");
      setPollOk(false);
      return;
    }

    const teardown = async () => {
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) await supabase.removeChannel(ch).catch(() => undefined);
    };

    const scheduleReconnect = () => {
      if (disposed || retryTimer) return;
      attempt += 1;
      const delay = Math.min(15_000, 1_000 * 2 ** Math.min(attempt - 1, 4));
      setRealtime("reconnecting");
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (disposed) return;
      await teardown();
      if (disposed) return;
      setRealtime(attempt === 0 ? "connecting" : "reconnecting");

      const channel = supabase
        .channel(REALTIME_CHANNEL, { config: { broadcast: { self: false, ack: false } } })
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "tv_state", filter: `id=eq.${TV_STATE_ID}` },
          (payload: RealtimePostgresUpdatePayload<TvState>) => {
            ingest(payload.new, "realtime");
          },
        )
        .on("broadcast", { event: NOT_FOUND_EVENT }, (message: { payload?: { code?: unknown } }) => {
          const code = message.payload?.code;
          if (typeof code === "string" && code) onNotFoundRef.current?.(code);
        });

      channelRef.current = channel;

      channel.subscribe((status, err) => {
        // Ignore callbacks from a channel we've already replaced / torn down.
        if (disposed || channelRef.current !== channel) return;
        if (status === "SUBSCRIBED") {
          attempt = 0;
          setRealtime("live");
          void refresh(); // catch up on anything missed while disconnected
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (err) console.warn(`[tv_state] realtime ${status}`, err);
          scheduleReconnect();
        }
      });
    };

    reconnectNowRef.current = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }
      attempt = Math.max(attempt, 1);
      void connect();
    };

    void refresh();
    void connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      reconnectNowRef.current = () => undefined;
      void teardown();
    };
  }, [ingest, refresh]);

  // --- Polling fallback + wake-up hooks ------------------------------------
  const realtimeRef = useRef(realtime);
  realtimeRef.current = realtime;

  useEffect(() => {
    const interval = setInterval(() => void refresh(), pollMs);

    const onWake = () => {
      if (document.visibilityState === "hidden") return;
      void refresh();
      if (realtimeRef.current !== "live") reconnectNowRef.current();
    };
    window.addEventListener("online", onWake);
    document.addEventListener("visibilitychange", onWake);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [pollMs, refresh]);

  const broadcastNotFound = useCallback(async (code: string) => {
    const channel = channelRef.current;
    if (!channel) return;
    try {
      await channel.send({ type: "broadcast", event: NOT_FOUND_EVENT, payload: { code } });
    } catch (err) {
      console.warn("[tv_state] broadcast failed", err);
    }
  }, []);

  return { row, realtime, pollOk, markSeen, broadcastNotFound, refresh };
}
