import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://odessavane.com"),
  title: {
    default: "Odessa Vane — Wedding & Party Photographer",
    template: "%s — Odessa Vane",
  },
  description:
    "Colour-forward wedding, party and environmental photography by Odessa Vane. Documentary coverage from Lisbon and Mexico City.",
  openGraph: {
    title: "Odessa Vane — Wedding & Party Photographer",
    description:
      "Colour-forward wedding, party and environmental photography. Nothing beige.",
    type: "website",
    images: ["/img/work-01.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf5ec",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
