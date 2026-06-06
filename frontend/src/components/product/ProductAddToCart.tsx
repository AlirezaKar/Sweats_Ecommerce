"use client";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { ProductListItem } from "@/types/api";

type Props = {
  product: ProductListItem;
  className?: string;
};

export function ProductAddToCart({ product, className }: Props) {
  return <AddToCartButton product={product} className={className} />;
}
