import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://my-fitness-app-tau-drab.vercel.app/sitemap.xml",
  };
}
