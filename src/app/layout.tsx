import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientShell from "../Components/ClientShell";

const poppins = Poppins({ weight: ["400", "600"], subsets: ["latin"], display: "swap" });

const SITE_URL = "https://my-fitness-app-tau-drab.vercel.app";
const TITLE = "My Fitness: gym admin dashboard";
const DESCRIPTION =
  "A gym admin dashboard built with Next.js: members, membership cards, staff and an activity chart. Demo data is saved in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | My Fitness" },
  description: DESCRIPTION,
  applicationName: "My Fitness",
  authors: [{ name: "Antiqa", url: "https://github.com/codelady-ship" }],
  alternates: { canonical: "/dashboard" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "My Fitness",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "My Fitness dashboard with member stats and an activity chart" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
};

export const viewport: Viewport = { themeColor: "#f59e0b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
