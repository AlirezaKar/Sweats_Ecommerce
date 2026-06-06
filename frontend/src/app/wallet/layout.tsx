import type { Metadata } from "next";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  fa.wallet.title,
  "مدیریت کیف پول و تراکنش‌ها در شیرینی‌خانه.",
  routes.wallet,
);

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
