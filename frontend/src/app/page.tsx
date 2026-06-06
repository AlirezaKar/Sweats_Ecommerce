import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductGridSection } from "@/components/home/ProductGridSection";
import { TodaysSalesSection } from "@/components/home/TodaysSalesSection";
import { BlogCarousel } from "@/components/blog/BlogCarousel";
import { fetchBlogPosts } from "@/lib/api/blog";
import { fetchProducts } from "@/lib/api/products";

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
