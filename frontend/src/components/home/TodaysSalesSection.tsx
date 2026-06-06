import { fa } from "@/lib/i18n/fa";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductListItem } from "@/types/api";

type Props = { products: ProductListItem[] };

export function TodaysSalesSection({ products }: Props) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/60 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-xl font-bold sm:text-2xl">{fa.home.todaysSales}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
