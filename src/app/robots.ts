import type { MetadataRoute } from "next";

const SITE_URL = "https://pyinfo.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
