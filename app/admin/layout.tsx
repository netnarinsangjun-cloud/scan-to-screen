import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Scan to Screen",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
