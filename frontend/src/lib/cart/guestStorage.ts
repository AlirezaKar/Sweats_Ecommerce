import type { ProductListItem } from "@/types/api";

const STORAGE_KEY = "guest_cart_v1";

export type GuestCartEntry = {
  product_id: number;
  quantity: number;
  product: ProductListItem;
};

export function readGuestCart(): GuestCartEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function guestCartToMergePayload(items: GuestCartEntry[]) {
  return items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
  }));
}

export function guestEntriesToCartShape(items: GuestCartEntry[]) {
  const lines = items.map((entry) => ({
    id: -entry.product_id,
    product: entry.product,
    quantity: entry.quantity,
    line_total: entry.product.final_price * entry.quantity,
  }));
  const item_count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total_price = lines.reduce((sum, line) => sum + line.line_total, 0);
  return { items: lines, item_count, total_price };
}
