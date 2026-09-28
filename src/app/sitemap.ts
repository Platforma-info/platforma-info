import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { problems } from "@/db/schema";
import { articleHref, getAllArticles } from "@/lib/theory/content";
import { TRACKS } from "@/lib/theory/tracks";

const SITE_URL = "https://pyinfo.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/problems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const theoryRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/theory`, changeFrequency: "weekly", priority: 0.9 },
    ...TRACKS.filter((t) => getAllArticles().some((a) => a.track === t.slug)).map((t) => ({
      url: `${SITE_URL}/theory/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...getAllArticles().map((a) => ({
      url: `${SITE_URL}${articleHref(a)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  try {
    const db = getDb();
    const rows = await db
      .select({ slug: problems.slug, createdAt: problems.createdAt })
      .from(problems);

    const problemRoutes: MetadataRoute.Sitemap = rows.map((row) => ({
      url: `${SITE_URL}/problems/${row.slug}`,
      lastModified: row.createdAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...theoryRoutes, ...problemRoutes];
  } catch {
    return [...staticRoutes, ...theoryRoutes];
  }
}
