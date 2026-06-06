"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaImage } from "@/components/ui/MediaImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";

export default function CartPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, setQuantity, removeItem } = useCart();

  function goCheckout() {
    if (!user) {
      router.push(`${routes.login}?next=${encodeURIComponent(routes.checkout)}`);
      return;
    }
    router.push(routes.checkout);
  }

  if (loading && cart.items.length === 0) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{fa.cart.title}</h1>
        <p className="mt-4 text-muted-foreground">{fa.cart.empty}</p>
        <Link href={routes.products} className="mt-6 inline-block text-primary hover:underline">
          {fa.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-primary">{fa.cart.title}</h1>

      <div className="mt-8 space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.id}
            className="flex gap-4 rounded-xl border border-border bg-background p-4 shadow-sm"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.product.main_image ? (
                <MediaImage
                  src={item.product.main_image}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <Link href={routes.product(item.product.slug)} className="font-medium hover:text-primary">
                {item.product.title}
              </Link>
              <p className="mt-1 text-sm text-primary">{formatPrice(item.product.final_price)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{fa.cart.quantity}</span>
                  <input
                    type="number"
                    min={1}
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isFinite(value)) void setQuantity(item.id, value);
                    }}
                    className="w-16 rounded border border-border px-2 py-1"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void removeItem(item.id)}
                  className="text-sm text-sale hover:underline"
                >
                  {fa.cart.remove}
                </button>
                <span className="ms-auto text-sm font-semibold">{formatPrice(item.line_total)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>{fa.cart.total}</span>
          <span>{formatPrice(cart.total_price)}</span>
        </div>
        {!user ? (
          <p className="mt-3 text-sm text-muted-foreground">{fa.cart.loginForCheckout}</p>
        ) : null}
        <button
          type="button"
          onClick={goCheckout}
          className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark sm:w-auto sm:px-8"
        >
          {fa.cart.checkout}
        </button>
      </div>
    </div>
  );
}
