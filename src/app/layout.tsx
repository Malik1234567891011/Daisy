import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import Providers from "./providers";
import Analytics from "@/components/Analytics";
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
  title: {
    default: "Daisy Weekly — Student Matchmaking in Montreal",
    template: "%s | Daisy Weekly",
  },
  description:
    "Daisy Weekly matches Montreal students with one thoughtful match every Wednesday. No swiping, no algorithms — just real connections on your campus.",
  metadataBase: new URL("https://www.daisyweekly.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Daisy Weekly — Student Matchmaking in Montreal",
    description:
      "Every Wednesday, one match. Daisy Weekly pairs Montreal students based on real preferences — not algorithms designed to waste your time.",
    type: "website",
    siteName: "Daisy Weekly",
    url: "https://www.daisyweekly.com",
    locale: "en_CA",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Daisy Weekly — Weekly student matchmaking in Montreal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daisy Weekly — Student Matchmaking in Montreal",
    description:
      "Every Wednesday, one match. Daisy Weekly pairs Montreal students based on real preferences.",
    images: ["/opengraph-image"],
  },
  keywords: [
    "Daisy Weekly",
    "student matchmaking Montreal",
    "Montreal student dating",
    "weekly dating app students",
    "campus matching Montreal",
    "no swipe dating app",
    "verified student dating",
    "McGill dating",
    "Concordia dating",
    "CEGEP dating Montreal",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Daisy Weekly",
                  url: "https://www.daisyweekly.com",
                  description:
                    "Weekly student matchmaking service in Montreal. One thoughtful match every Wednesday.",
                  sameAs: ["https://instagram.com/daisyweeklymtl"],
                },
                {
                  "@type": "WebSite",
                  name: "Daisy Weekly",
                  url: "https://www.daisyweekly.com",
                  description:
                    "Daisy Weekly matches Montreal students with one thoughtful match every Wednesday.",
                },
                {
                  "@type": "LocalBusiness",
                  name: "Daisy Weekly",
                  description:
                    "Weekly student matchmaking service for Montreal campuses. One curated match every Wednesday for students at McGill, Concordia, UdeM, and 25+ CEGEPs.",
                  url: "https://www.daisyweekly.com",
                  areaServed: {
                    "@type": "City",
                    name: "Montreal",
                    containedInPlace: {
                      "@type": "AdministrativeArea",
                      name: "Quebec, Canada",
                    },
                  },
                  serviceType: "Student Matchmaking",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
