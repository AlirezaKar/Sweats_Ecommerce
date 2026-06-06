import Link from "next/link";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import { MediaImage } from "@/components/ui/MediaImage";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductAddToCart } from "@/components/product/ProductAddToCart";
import { ProductComments } from "@/components/product/ProductComments";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import { fetchProduct, fetchRelatedProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  let product;
  let related: Awaited<ReturnType<typeof fetchRelatedProducts>> = [];
  try {
    product = await fetchProduct(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
  try {
    related = await fetchRelatedProducts(slug);
  } catch {
    related = [];
  }

  const mainImage =
    product.images.find((i) => i.is_main)?.url ?? product.images[0]?.url ?? product.main_image;
  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 truncate text-sm text-muted-foreground">
        <Link href={routes.home} className="hover:text-primary">خانه</Link>
        {" / "}
        <Link href={routes.products} className="hover:text-primary">فروشگاه</Link>
        {" / "}
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Image first on phone/tablet */}
        <div className="order-1 lg:order-3 lg:col-span-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {mainImage ? (
              <MediaImage src={mainImage} alt={product.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 33vw" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                بدون تصویر
              </div>
            )}
          </div>
        </div>

        <div className="order-2 space-y-4 lg:order-2 lg:col-span-5">
          <h1 className="text-xl font-bold sm:text-2xl">{product.title}</h1>
          {!outOfStock && (
            <span className="inline-block rounded bg-accent/15 px-2 py-0.5 text-xs text-accent">
              {fa.product.inStock}
            </span>
          )}
          <p className="text-muted-foreground">{product.description.slice(0, 200)}…</p>
          <div className="flex flex-wrap items-center gap-3">
            {product.is_on_sale && product.discounted_price != null && (
              <span className="text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.final_price)}
            </span>
          </div>
          {outOfStock && <p className="text-sale">{fa.product.outOfStock}</p>}

          {/* Sticky CTA on mobile */}
          <ProductAddToCart
            product={product}
            className="touch-target w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 lg:hidden"
          />
        </div>

        <aside className="order-3 lg:order-1 lg:col-span-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm lg:sticky lg:top-24">
            <p className="font-medium">ضمانت کیفیت</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>• ۷ روز ضمانت بازگشت</li>
              <li>• ارسال سریع در تهران</li>
              <li>• پیگیری سفارش آنلاین</li>
            </ul>
            <ProductAddToCart
              product={product}
              className="touch-target mt-4 hidden w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 lg:block"
            />
          </div>
        </aside>
      </div>

      {product.detailed_description.trim() && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">{fa.product.additionalInfo}</h2>
          <div className="rounded-xl border border-border p-4 sm:p-6">
            <BlogArticleBody body={product.detailed_description} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">{fa.product.related}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <ProductComments slug={slug} comments={product.comments} />
    </div>
  );
}
