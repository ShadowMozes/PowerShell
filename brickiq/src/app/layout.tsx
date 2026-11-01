import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BrickIQ — Know Before You Buy",
    template: "%s · BrickIQ",
  },
  description:
    "AI-powered property intelligence for Dutch homebuyers: transparent fair-value estimates, Deal Score, comparables and a bidding simulator.",
  applicationName: "BrickIQ",
  appleWebApp: { capable: true, title: "BrickIQ", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f2e9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
