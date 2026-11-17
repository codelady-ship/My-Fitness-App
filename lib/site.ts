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
