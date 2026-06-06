import type { Metadata } from "next";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  fa.orders.title,
  "لیست سفارش‌های شما در شیرینی‌خانه.",
  routes.orders,
);

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
