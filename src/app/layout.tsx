import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/shared/nav";

export const metadata: Metadata = {
  title: "Market Event Impact Intelligence System",
  description: "Research-style dashboard for company news, macro events, and sector/company impact analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden bg-muted/30 font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
