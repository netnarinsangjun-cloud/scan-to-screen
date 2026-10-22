import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// One family for headings, labels and body: covers Latin and Thai with the same
// clean humanist shapes as the reference artwork.
const body = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scan to Screen",
  description: "Event booth product showcase — scan a barcode, see it on the big screen.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFFDFB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={body.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
