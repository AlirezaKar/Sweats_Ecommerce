"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { fa } from "@/lib/i18n/fa";
import type { ProductListItem } from "@/types/api";

type Props = {
  product: ProductListItem;
  className?: string;
};

export function AddToCartButton({ product, className }: Props) {
  const { addProduct } = useCart();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const outOfStock = product.stock <= 0;

  async function handleClick() {
    if (outOfStock || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await addProduct(product, 1);
      setNotice(fa.cart.added);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={outOfStock || busy}
        onClick={() => void handleClick()}
        className={
          className ??
          "touch-target w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        }
      >
        {busy ? fa.common.loading : outOfStock ? fa.product.outOfStock : fa.product.addToCart}
      </button>
      {notice ? <p className="mt-2 text-xs text-accent">{notice}</p> : null}
    </div>
  );
}
