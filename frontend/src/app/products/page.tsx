import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCategorySidebar } from "@/components/product/ProductCategorySidebar";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { fetchCategories, fetchProducts } from "@/lib/api/products";
import { buildPageMetadata, truncateDescription } from "@/lib/seo/metadata";

type Props = { searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams;

  if (category) {
    const categories = await fetchCategories().catch(() => []);
    const activeCategory = categories.find((item) => item.slug === category);
    if (activeCategory) {
      return buildPageMetadata({
        title: activeCategory.name,
        description:
          activeCategory.description?.trim() ||
          `خرید ${activeCategory.name} تازه و خانگی از شیرینی‌خانه با ارسال سریع در تهران.`,
        path: `${routes.products}?category=${encodeURIComponent(category)}`,
      });
    }
  }

  return buildPageMetadata({
    title: fa.nav.shop,
    description: truncateDescription(
      "فروشگاه آنلاین شیرینی، کیک و دسر — محصولات تازه با قیمت شفاف و ارسال سریع در تهران.",
    ),
    path: routes.products,
  });
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const [products, categories] = await Promise.all([
    fetchProducts({ page_size: 48, category }).catch(() => []),
    fetchCategories().catch(() => []),
  ]);

  const activeCategory = category
    ? categories.find((item) => item.slug === category)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.nav.shop}</h1>
        {activeCategory ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {fa.shop.categoryFilter}: {activeCategory.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_14rem] lg:items-start">
        <aside className="order-1 min-w-0 lg:order-2">
          <ProductCategorySidebar categories={categories} activeSlug={category} />
        </aside>

        <div className="order-2 min-w-0 lg:order-1">
          {products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
              {fa.shop.noProducts}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p, index) => (
                <ProductCard key={p.id} product={p} priority={index === 0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
