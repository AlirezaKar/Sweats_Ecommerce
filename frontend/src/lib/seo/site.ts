import { fa } from "@/lib/i18n/fa";

export const SITE_NAME = fa.common.siteName;

export const DEFAULT_DESCRIPTION =
  "فروشگاه آنلاین شیرینی و کیک خانگی با مواد اولیه تازه، ارسال سریع در تهران و محصولات با کیفیت برای مناسبت‌ها و پذیرایی روزمره.";

/** Public site origin — set NEXT_PUBLIC_SITE_URL in production (e.g. https://sweats-shop.vercel.app). */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
