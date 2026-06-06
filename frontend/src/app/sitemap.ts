import type { MetadataRoute } from "next";
import { collectSitemapEntries } from "@/lib/seo/sitemap-data";
import { getSiteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const entries = await collectSitemapEntries(siteUrl);

  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
