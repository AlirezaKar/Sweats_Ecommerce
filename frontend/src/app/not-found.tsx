import type { Metadata } from "next";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "صفحه یافت نشد",
  description: "صفحه‌ای که دنبال آن بودید وجود ندارد. به فروشگاه شیرینی‌خانه برگردید.",
  path: "/404",
  index: false,
});

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-6xl font-bold text-primary/30">۴۰۴</p>
      <h1 className="mt-4 text-2xl font-bold">صفحه یافت نشد</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        آدرس اشتباه است یا این صفحه حذف شده. می‌توانید از لینک‌های زیر ادامه دهید.
      </p>
      <nav className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={routes.home}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          {fa.nav.home}
        </Link>
        <Link
          href={routes.products}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/50"
        >
          {fa.nav.shop}
        </Link>
        <Link
          href={routes.blog}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/50"
        >
          {fa.nav.blog}
        </Link>
        <Link
          href={routes.contact}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/50"
        >
          {fa.nav.contact}
        </Link>
      </nav>
    </div>
  );
}
