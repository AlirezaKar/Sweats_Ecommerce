import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = privatePageMetadata(
  "ورود و ثبت‌نام",
  "ورود یا ایجاد حساب کاربری در شیرینی‌خانه.",
  "/auth",
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
