import type { Metadata } from "next";

export const SITE_URL = "https://my-fitness-app-tau-drab.vercel.app";

export const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/coaches", label: "Coaches" },
  { href: "/pricing", label: "Pricing" },
] as const;

/** Clips in public/media (see docs/CREDITS.md). */
export const MEDIA = {
  hero: { src: "/media/hero.mp4", webm: "/media/hero.webm", poster: "/media/hero-poster.jpg" },
  programs: { src: "/media/programs.mp4", poster: "/media/programs-poster.jpg" },
  coaches: { src: "/media/coaches.mp4", poster: "/media/coaches-poster.jpg" },
} as const;

/** Same card as app/opengraph-image.tsx (its route is served at /opengraph-image). */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Pulsa: your personal heart coach. Glass cards with a heart-rate gauge on a pale blue background.",
};

/**
 * Title, description, canonical and a matching Open Graph / Twitter card for one page.
 * Page metadata replaces the layout's openGraph object as a whole, so every page
 * sets its own url, title and the image from app/opengraph-image.tsx.
 */
export function pageMeta(path: string, title: string, description: string): Metadata {
  const full = `${title} | Pulsa`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Pulsa", locale: "en_US", url: path, title: full, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: full, description, images: [OG_IMAGE.url] },
  };
}

/** JSON for <script type="application/ld+json">; "<" escaped so the data cannot end the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
