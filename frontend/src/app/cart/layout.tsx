import type { Metadata } from "next";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  fa.cart.title,
  "سبد خرید شما در شیرینی‌خانه.",
  routes.cart,
);

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
