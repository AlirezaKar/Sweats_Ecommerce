"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { addCartItem, fetchCart, mergeGuestCart, removeCartItem, updateCartItem } from "@/lib/api/cart";
import {
  clearGuestCart,
  guestCartToMergePayload,
  guestEntriesToCartShape,
  readGuestCart,
  writeGuestCart,
  type GuestCartEntry,
} from "@/lib/cart/guestStorage";
import type { Cart, ProductListItem } from "@/types/api";

type CartContextValue = {
  cart: Cart;
  loading: boolean;
  addProduct: (product: ProductListItem, quantity?: number) => Promise<void>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  refreshCart: () => Promise<Cart>;
};

const emptyCart: Cart = { items: [], item_count: 0, total_price: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef<string | null>(null);

  const loadGuest = useCallback(() => {
    setCart(guestEntriesToCartShape(readGuestCart()));
  }, []);

  const refreshCart = useCallback(async () => {
    if (!token) {
      const guest = guestEntriesToCartShape(readGuestCart());
      loadGuest();
      return guest;
    }
    setLoading(true);
    try {
      const guestItems = readGuestCart();
      if (guestItems.length > 0) {
        await mergeGuestCart(token, guestCartToMergePayload(guestItems));
        clearGuestCart();
        mergedRef.current = token;
      }
      const data = await fetchCart(token);
      setCart(data);
      return data;
    } catch {
      setCart(emptyCart);
      return emptyCart;
    } finally {
      setLoading(false);
    }
  }, [token, loadGuest]);

  useEffect(() => {
    if (!token) {
      mergedRef.current = null;
      loadGuest();
      return;
    }

    const authToken = token;
    let cancelled = false;

    async function sync() {
      setLoading(true);
      try {
        const guestItems = readGuestCart();
        if (guestItems.length > 0 && mergedRef.current !== authToken) {
          await mergeGuestCart(authToken, guestCartToMergePayload(guestItems));
          clearGuestCart();
          mergedRef.current = authToken;
        }
        const data = await fetchCart(authToken);
        if (!cancelled) setCart(data);
      } catch {
        if (!cancelled) setCart(emptyCart);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [token, loadGuest]);

  const addProduct = useCallback(
    async (product: ProductListItem, quantity = 1) => {
      if (product.stock <= 0) return;

      if (!token) {
        const items = readGuestCart();
        const existing = items.find((item) => item.product_id === product.id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, product.stock);
          existing.product = product;
        } else {
          items.push({
            product_id: product.id,
            quantity: Math.min(quantity, product.stock),
            product,
          });
        }
        writeGuestCart(items);
        setCart(guestEntriesToCartShape(items));
        return;
      }

      const data = await addCartItem(token, product.id, quantity);
      setCart(data);
    },
    [token],
  );

  const setQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (quantity < 1) return;

      if (!token || itemId < 0) {
        const productId = -itemId;
        const items = readGuestCart();
        const entry = items.find((item) => item.product_id === productId);
        if (!entry) return;
        entry.quantity = Math.min(quantity, entry.product.stock);
        writeGuestCart(items);
        setCart(guestEntriesToCartShape(items));
        return;
      }

      const data = await updateCartItem(token, itemId, quantity);
      setCart(data);
    },
    [token],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!token || itemId < 0) {
        const productId = -itemId;
        const items = readGuestCart().filter((item) => item.product_id !== productId);
        writeGuestCart(items);
        setCart(guestEntriesToCartShape(items));
        return;
      }

      const data = await removeCartItem(token, itemId);
      setCart(data);
    },
    [token],
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      addProduct,
      setQuantity,
      removeItem,
      refreshCart,
    }),
    [cart, loading, addProduct, setQuantity, removeItem, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
