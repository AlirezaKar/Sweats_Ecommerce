"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { routes } from "@/lib/constants/routes";

export function CartBadge() {
  const { cart } = useCart();
  const count = cart.item_count;

  return (
    <Link
      href={routes.cart}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
      aria-label={`سبد خرید${count > 0 ? ` — ${count} قلم` : ""}`}
    >
      <CartIcon />
      {count > 0 ? (
        <span className="absolute -top-1 -start-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6 6L5 3H2" />
    </svg>
  );
}
