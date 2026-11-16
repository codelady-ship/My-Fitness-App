import type { MetadataRoute } from "next";

const SITE_URL = "https://my-fitness-app-tau-drab.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/dashboard", "/users", "/cards", "/staff"].map((p) => ({
    url: SITE_URL + p,
    changeFrequency: "monthly",
    priority: p === "/dashboard" ? 1 : 0.7,
  }));
}
