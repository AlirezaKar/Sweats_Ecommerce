import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductListItem } from "@/types/api";

type Props = { products: ProductListItem[] };

export function ProductGridSection({ products }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{fa.home.allProducts}</h2>
        <Link href={routes.products} className="text-sm text-primary hover:underline">
          {fa.common.viewAll}
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground">محصولی یافت نشد.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, index) => (
            <ProductCard key={p.id} product={p} priority={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
