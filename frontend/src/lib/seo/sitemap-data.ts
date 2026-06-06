import { API_BASE_URL } from "@/lib/constants/config";
import { endpoints } from "@/lib/constants/endpoints";
import { routes } from "@/lib/constants/routes";
import type { BlogPostListItem, CourseListItem, ProductListItem, Tutorial } from "@/types/api";
import type { Paginated } from "@/types/api";
import { fetchCourse } from "@/lib/api/courses";

async function fetchAllPaginated<T>(path: string, pageSize = 100): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (page <= 50) {
    const url = new URL(path, API_BASE_URL);
    url.searchParams.set("page_size", String(pageSize));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) break;

    const data = (await res.json()) as Paginated<T>;
    const results = data.results ?? [];
    all.push(...results);
    if (!data.next) break;
    page += 1;
  }

  return all;
}

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export async function collectSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const base = baseUrl.replace(/\/$/, "");
  const staticPages: SitemapEntry[] = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}${routes.products}`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}${routes.blog}`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}${routes.courses}`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}${routes.tutorials}`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}${routes.about}`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}${routes.contact}`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}${routes.faq}`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [products, posts, courses, tutorials] = await Promise.all([
    fetchAllPaginated<ProductListItem>(endpoints.products).catch(() => []),
    fetchAllPaginated<BlogPostListItem>(endpoints.blog).catch(() => []),
    fetchAllPaginated<CourseListItem>(endpoints.courses).catch(() => []),
    fetchAllPaginated<Tutorial>(endpoints.tutorials).catch(() => []),
  ]);

  const productEntries: SitemapEntry[] = products.map((p) => ({
    url: `${base}${routes.product(p.slug)}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: SitemapEntry[] = posts.map((p) => ({
    url: `${base}${routes.blogPost(p.slug)}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const courseEntries: SitemapEntry[] = [];
  for (const course of courses) {
    courseEntries.push({
      url: `${base}${routes.course(course.slug)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    try {
      const detail = await fetchCourse(course.slug);
      for (const episode of detail.episodes) {
        courseEntries.push({
          url: `${base}${routes.courseWatch(course.slug, episode.slug)}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    } catch {
      /* skip episode URLs if course detail unavailable */
    }
  }

  const tutorialEntries: SitemapEntry[] = tutorials.map((t) => ({
    url: `${base}${routes.tutorialWatch(t.slug)}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...productEntries,
    ...blogEntries,
    ...courseEntries,
    ...tutorialEntries,
  ];
}
