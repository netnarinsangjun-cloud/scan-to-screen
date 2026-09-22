import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-void bg-hud-grid bg-grid px-6">
      <div className="text-center">
        <p className="font-hud text-sm tracking-[0.5em] text-crimson-400">EVENT BOOTH SYSTEM</p>
        <h1 className="neon-text mt-3 font-display text-4xl font-black tracking-widest sm:text-6xl">
          SCAN TO SCREEN
        </h1>
      </div>
      <div className="grid w-full max-w-md gap-4">
        <Link href="/tv" className="btn-primary">
          Open TV display
        </Link>
        <Link href="/scanner" className="btn-ghost">
          Open mobile scanner
        </Link>
      </div>
    </main>
  );
}
