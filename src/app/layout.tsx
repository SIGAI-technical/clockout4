import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const anton = Anton({ variable: "--f-logo", subsets: ["latin"], weight: "400", display: "swap" });
const archivo = Archivo({ variable: "--f-sans", subsets: ["latin"], axes: ["wdth"], display: "swap" });
// Doom's voice in stone and iron: Roman inscriptional capitals
const cinzel = Cinzel({ variable: "--f-decree", subsets: ["latin"], weight: ["500", "700", "900"], display: "swap" });
const cormorant = Cormorant_Garamond({
  variable: "--f-voice",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Clockout 4.0 — The Doom Takeover",
  description:
    "Doom has declared war on the fourth floor. Avengers, Fantastic Four, X-Men and Shang-Chi stand against him. Clockout 4.0 by SIGAI, AIML Department.",
  openGraph: {
    title: "Clockout 4.0 — The Doom Takeover",
    description: "Doom has declared war. Choose your side.",
    images: [{ url: "/cine/throne.jpg", width: 1280, height: 536, alt: "The throne of Doom" }],
  },
  twitter: { card: "summary_large_image", images: ["/cine/throne.jpg"] },
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
