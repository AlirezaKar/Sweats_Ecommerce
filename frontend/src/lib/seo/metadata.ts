import type { Metadata } from "next";
import { resolveMediaUrl } from "@/lib/utils/mediaUrl";
import { SITE_NAME, absoluteUrl, getSiteUrl } from "./site";

export function truncateDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  index?: boolean;
};

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const {
    title,
    description,
    path,
    image,
    type = "website",
    publishedTime,
    modifiedTime,
    authors,
    index = true,
  } = input;

  const canonical = absoluteUrl(path);
  const desc = truncateDescription(description);
  const resolvedImage = resolveMediaUrl(image);
  const ogImage = resolvedImage ?? absoluteUrl("/og-default.svg");
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: canonical,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type,
      images: [{ url: ogImage, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
  };
}

export const privatePageMetadata = (title: string, description: string, path: string): Metadata =>
  buildPageMetadata({ title, description, path, index: false });

export function rootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} | فروشگاه آنلاین شیرینی و کیک خانگی`,
      template: `%s | ${SITE_NAME}`,
    },
    description: truncateDescription(
      "فروشگاه آنلاین شیرینی و کیک خانگی — سفارش شیرینی تازه با ارسال سریع در تهران.",
    ),
    alternates: { canonical: "/" },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} | فروشگاه آنلاین شیرینی و کیک خانگی`,
      description: truncateDescription(
        "فروشگاه آنلاین شیرینی و کیک خانگی — سفارش شیرینی تازه با ارسال سریع در تهران.",
      ),
      images: [{ url: absoluteUrl("/og-default.svg"), alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | فروشگاه آنلاین شیرینی و کیک خانگی`,
      description: truncateDescription(
        "فروشگاه آنلاین شیرینی و کیک خانگی — سفارش شیرینی تازه با ارسال سریع در تهران.",
      ),
      images: [absoluteUrl("/og-default.svg")],
    },
    robots: { index: true, follow: true },
  };
}
