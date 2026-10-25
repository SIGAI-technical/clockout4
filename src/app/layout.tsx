import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const anton = Anton({ variable: "--f-logo", subsets: ["latin"], weight: "400", display: "swap" });
const archivo = Archivo({ variable: "--f-sans", subsets: ["latin"], axes: ["wdth"], display: "swap" });
// Doom's voice in stone and iron: Roman inscriptional capitals
const cinzel = Cinzel({ variable: "--f-decree", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({
  variable: "--f-voice",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://clockout.djscesigai.tech"),
  title: "Clockout 4.0 — The Doom Takeover",
  description: "The multiverse has a new ruler. Three trials, ₹60,000 in prizes. 30 October 2026, 4th Floor, AIML Department. By SIGAI.",
  openGraph: {
    title: "Clockout 4.0 — The Doom Takeover",
    description: "Doom has taken the AIML Department. Clockout 4.0 is his tournament.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Doom's iron mask beside the title Clockout 4.0, The Doom Takeover" }],
  },
  twitter: { card: "summary_large_image", title: "Clockout 4.0 — The Doom Takeover", description: "Doom has taken the AIML Department.", images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#030504", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${cinzel.variable} ${cormorant.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('scrollRestoration' in history)history.scrollRestoration='manual';`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
