import type { Metadata, Viewport } from "next";
import { Dancing_Script, Fraunces, Manrope, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

// Display serif: variable with optical sizing (no weight array → full variable range)
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap" });
// UI sans: has the ₹ glyph (latin-ext) and true tabular figures
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });
// Script for the wordmark, section titles and category tiles (variable 400–700)
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing", display: "swap" });
// One Hindi word per page at most — only downloaded where Devanagari text appears
const tiro = Tiro_Devanagari_Hindi({ weight: "400", subsets: ["devanagari"], preload: false, variable: "--font-tiro", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: { default: "Kavita’s Artistry — Handmade art & decor", template: "%s · Kavita’s Artistry" },
  description:
    "Handmade art & craft from Kavita’s home studio — Lippan mirror work, mandalas, wall decor, festive & pooja pieces, name plates and personalised gifts. Order easily on WhatsApp.",
  openGraph: { type: "website", siteName: "Kavita’s Artistry", images: ["/brand/brand-board.jpg"] },
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#f6ede3", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable} ${tiro.variable} ${dancing.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
