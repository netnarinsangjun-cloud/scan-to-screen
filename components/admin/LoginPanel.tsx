"use client";

import { useState, type FormEvent } from "react";

interface Props {
  onSignIn: (username: string, password: string) => Promise<void>;
}

const inputClass =
  "h-12 w-full border border-graphite-500 bg-graphite-800 px-3 text-base text-white outline-none focus:border-scarlet-500 focus:shadow-glow-sm";

export function LoginPanel({ onSignIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
    setBusy(true);
    setError(null);
    try {
      await onSignIn(username, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        /invalid login credentials/i.test(message)
          ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
          : /rate limit|too many/i.test(message)
            ? "ลองเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่"
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hud-panel mx-auto w-full max-w-md p-8">
      <p className="font-hud text-sm font-semibold tracking-[0.4em] text-crimson-400">BACK OFFICE</p>
      <h1 className="neon-text mt-2 font-display text-3xl font-black tracking-wider">ADMIN LOGIN</h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-graphite-200">ชื่อผู้ใช้</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="admin"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-graphite-200">รหัสผ่าน</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        {error ? <p className="text-sm text-scarlet-400">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
