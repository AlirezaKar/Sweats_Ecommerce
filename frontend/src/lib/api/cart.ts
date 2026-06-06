import { endpoints } from "@/lib/constants/endpoints";
import { apiFetchAuth } from "@/lib/api/client";
import type { Cart } from "@/types/api";

export async function fetchCart(token: string): Promise<Cart> {
  return apiFetchAuth<Cart>(endpoints.cart, token);
}

export async function addCartItem(
  token: string,
  productId: number,
  quantity = 1,
): Promise<Cart> {
  return apiFetchAuth<Cart>(endpoints.cartItems, token, {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function updateCartItem(
  token: string,
  itemId: number,
  quantity: number,
): Promise<Cart> {
  return apiFetchAuth<Cart>(endpoints.cartItem(itemId), token, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(token: string, itemId: number): Promise<Cart> {
  return apiFetchAuth<Cart>(endpoints.cartItemRemove(itemId), token, {
    method: "DELETE",
  });
}

export async function mergeGuestCart(
  token: string,
  items: { product_id: number; quantity: number }[],
): Promise<Cart> {
  return apiFetchAuth<Cart>(endpoints.cartMerge, token, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
