import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["600", "800"], display: "swap", variable: "--font-inter-tight" });

const TITLE = "Pulsa: your personal heart coach";
const DESCRIPTION =
  "Pulsa is a cardio-coaching app that reads every beat, adapts your training plan daily and turns your heart data into real progress.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Pulsa" },
  description: DESCRIPTION,
  applicationName: "Pulsa",
  authors: [{ name: "Antiqa", url: "https://github.com/codelady-ship" }],
  keywords: ["cardio coaching", "heart rate training", "zone 2", "fitness app", "heart coach"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Pulsa",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#eef3fb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
