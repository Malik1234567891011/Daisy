import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daisy — Thoughtful Student Matching",
  description:
    "Daisy matches students with intention. No endless swiping, no awkward DMs — just thoughtful connections on your campus.",
  metadataBase: new URL("https://joindaisy.com"),
  openGraph: {
    title: "Daisy — Thoughtful Student Matching",
    description:
      "Meet someone worth meeting. Daisy pairs students based on real preferences, not algorithms designed to waste your time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
