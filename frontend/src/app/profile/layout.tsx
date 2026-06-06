import type { Metadata } from "next";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  fa.profile.title,
  "مدیریت حساب کاربری در شیرینی‌خانه.",
  routes.profile,
);

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
