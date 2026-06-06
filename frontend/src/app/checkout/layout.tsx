import type { Metadata } from "next";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  fa.checkout.title,
  fa.checkout.subtitle,
  routes.checkout,
);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
