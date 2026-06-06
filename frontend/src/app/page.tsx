import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductGridSection } from "@/components/home/ProductGridSection";
import { TodaysSalesSection } from "@/components/home/TodaysSalesSection";
import { BlogCarousel } from "@/components/blog/BlogCarousel";
import { fetchBlogPosts } from "@/lib/api/blog";
import { fetchProducts } from "@/lib/api/products";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DEFAULT_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: fa.common.siteName,
  description: `${DEFAULT_DESCRIPTION} ${fa.home.heroTitle}.`,
  path: routes.home,
});

export default async function HomePage() {
  const [products, saleProducts, blogPosts] = await Promise.all([
    fetchProducts({ page_size: 8 }).catch(() => []),
    fetchProducts({ page_size: 3, on_sale: true }).catch(() => []),
    fetchBlogPosts(4).catch(() => []),
  ]);

  return (
    <>
      <HeroCarousel />
      <ProductGridSection products={products} />
      <TodaysSalesSection products={saleProducts} />
      <BlogCarousel posts={blogPosts} />
    </>
  );
}
