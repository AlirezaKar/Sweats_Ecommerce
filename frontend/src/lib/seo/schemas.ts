import { contactDetails } from "@/content/contact";
import { faqItems } from "@/content/faq";
import { routes } from "@/lib/constants/routes";
import { resolveMediaUrl } from "@/lib/utils/mediaUrl";
import type { BlogPostDetail, CourseDetail, CourseEpisode, ProductDetail, Tutorial } from "@/types/api";
import { SITE_NAME, absoluteUrl } from "./site";

type BreadcrumbItem = { name: string; path: string };

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/favicon.svg"),
    image: absoluteUrl("/og-default.svg"),
    telephone: `+98${contactDetails.phoneHref.replace(/^0/, "")}`,
    email: contactDetails.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "تهران",
      addressCountry: "IR",
      streetAddress: contactDetails.address,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "21:00",
    },
    sameAs: [] as string[],
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function productRatings(comments: ProductDetail["comments"]) {
  const ratings = comments.map((c) => c.rating).filter((r) => r > 0);
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return {
    "@type": "AggregateRating",
    ratingValue: (sum / ratings.length).toFixed(1),
    reviewCount: ratings.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/** Backend prices are in Toman; schema.org expects IRR (×10). */
function priceInIrr(toman: number): string {
  return String(toman * 10);
}

export function productSchema(product: ProductDetail) {
  const image =
    resolveMediaUrl(
      product.images.find((i) => i.is_main)?.url ?? product.images[0]?.url ?? product.main_image,
    ) ?? absoluteUrl("/og-default.svg");

  const aggregateRating = productRatings(product.comments);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image,
    sku: String(product.id),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(routes.product(product.slug)),
      priceCurrency: "IRR",
      price: priceInIrr(product.final_price),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    ...(aggregateRating ? { aggregateRating } : {}),
  };
}

export function articleSchema(post: BlogPostDetail) {
  const image = resolveMediaUrl(post.thumbnail) ?? absoluteUrl("/og-default.svg");

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.author_name },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.svg") },
    },
    mainEntityOfPage: absoluteUrl(routes.blogPost(post.slug)),
  };
}

export function courseSchema(course: CourseDetail) {
  const image = resolveMediaUrl(course.thumbnail) ?? absoluteUrl("/og-default.svg");

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    image,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    instructor: { "@type": "Person", name: course.instructor_name },
    offers: course.is_free
      ? {
          "@type": "Offer",
          price: "0",
          priceCurrency: "IRR",
          availability: "https://schema.org/InStock",
        }
      : course.price != null
        ? {
            "@type": "Offer",
            price: priceInIrr(course.price),
            priceCurrency: "IRR",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${course.total_duration_minutes}M`,
    },
  };
}

export function videoObjectSchema(input: {
  name: string;
  description: string;
  thumbnailUrl?: string | null;
  uploadDate?: string;
  durationMinutes?: number;
  path: string;
}) {
  const thumbnail = resolveMediaUrl(input.thumbnailUrl) ?? absoluteUrl("/og-default.svg");

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    thumbnailUrl: thumbnail,
    uploadDate: input.uploadDate,
    ...(input.durationMinutes
      ? { duration: `PT${input.durationMinutes}M` }
      : {}),
    contentUrl: absoluteUrl(input.path),
  };
}

export function courseEpisodeVideoSchema(
  course: CourseDetail,
  episode: CourseEpisode,
) {
  return videoObjectSchema({
    name: `${course.title} — ${episode.title}`,
    description: episode.description || course.description,
    thumbnailUrl: course.thumbnail,
    uploadDate: course.created_at,
    durationMinutes: episode.duration_minutes,
    path: routes.courseWatch(course.slug, episode.slug),
  });
}

export function tutorialVideoSchema(clip: Tutorial) {
  return videoObjectSchema({
    name: clip.title,
    description: clip.description,
    thumbnailUrl: clip.thumbnail,
    uploadDate: clip.created_at,
    durationMinutes: clip.duration_minutes,
    path: routes.tutorialWatch(clip.slug),
  });
}

export function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
