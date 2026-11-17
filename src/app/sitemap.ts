import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES: [string, number][] = [
  ["/", 1],
  ["/programs", 0.9],
  ["/coaches", 0.8],
  ["/pricing", 0.9],
  ["/contact", 0.6],
  ["/register", 0.5],
  ["/login", 0.3],
  ["/dashboard", 0.4],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(([p, priority]) => ({ url: SITE_URL + p, changeFrequency: "monthly", priority }));
}
