"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { usernameToEmail } from "@/lib/config";
import { checkIsAdmin, getSupabase } from "@/lib/supabase";

export type AdminStatus = "loading" | "signed_out" | "not_admin" | "admin" | "error";

interface Result {
  status: AdminStatus;
  email: string | null;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Username + password admin session (Supabase Auth). A signed-in user is only
 * treated as an admin when the database's `is_admin()` confirms their account
 * is on the allow-list.
 */
export function useAdminSession(): Result {
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
      return;
    }

    const evaluate = async (session: Session | null) => {
      if (cancelled) return;
      if (!session) {
        setEmail(null);
        setStatus("signed_out");
        return;
      }
      setEmail(session.user.email ?? null);
      try {
        const ok = await checkIsAdmin();
        if (!cancelled) setStatus(ok ? "admin" : "not_admin");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    supabase.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes don't change who is signed in; skip the extra RPC.
      if (event === "TOKEN_REFRESHED") return;
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => void evaluate(session), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (err) throw err;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  return { status, email, error, signIn, signOut };
}
