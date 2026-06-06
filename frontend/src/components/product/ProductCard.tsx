import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { ProductListItem } from "@/types/api";

type Props = { product: ProductListItem; priority?: boolean };

export function ProductCard({ product, priority }: Props) {
  const href = routes.product(product.slug);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group rounded-xl border border-border bg-background p-3 transition hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {product.is_on_sale && (
            <span className="absolute start-2 top-2 z-10 rounded bg-sale px-2 py-0.5 text-xs text-white">
              حراج
            </span>
          )}
          {product.main_image ? (
            <MediaImage
              src={product.main_image}
              alt={product.title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width:640px) 50vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              بدون تصویر
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-medium">{product.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {product.is_on_sale && product.discounted_price != null && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
          <span className="text-sm font-semibold text-primary">
            {formatPrice(product.final_price)}
          </span>
        </div>
        {outOfStock && (
          <p className="mt-1 text-xs text-sale">ناموجود</p>
        )}
      </Link>
    </article>
  );
}
