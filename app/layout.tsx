import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const display = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const hud = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-hud",
  display: "swap",
});

// Body font covers both Latin and Thai so product descriptions render cleanly.
const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scan to Screen",
  description: "Event booth product showcase — scan a barcode, see it on the big screen.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${hud.variable} ${body.variable}`}>
      <body className="font-sans">
        {children}
        <div className="hud-overlay" aria-hidden />
      </body>
    </html>
  );
}
