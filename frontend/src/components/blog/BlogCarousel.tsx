"use client";

import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { CarouselFrame } from "@/components/ui/CarouselFrame";
import { useHorizontalCarousel } from "@/lib/hooks/useHorizontalCarousel";
import { BlogCard } from "./BlogCard";
import type { BlogPostListItem } from "@/types/api";

type Props = { posts: BlogPostListItem[] };

export function BlogCarousel({ posts }: Props) {
  const {
    trackRef,
    activePage,
    pageCount,
    scrollToPage,
    scrollByPage,
    onTouchStart,
    onTouchEnd,
    trackClassName,
  } = useHorizontalCarousel({
    itemCount: posts.length,
    cardSelector: "[data-blog-card]",
  });

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <h2 className="text-xl font-bold text-primary">{fa.home.latestBlog}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>

      <CarouselFrame
        trackRef={trackRef}
        trackClassName={trackClassName}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        activePage={activePage}
        pageCount={pageCount}
        scrollToPage={scrollToPage}
        scrollByPage={scrollByPage}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            data-blog-card
            className="w-[85vw] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <BlogCard post={post} className="h-full" />
          </div>
        ))}
      </CarouselFrame>

      <div className="mt-6 text-center">
        <Link href={routes.blog} className="text-sm text-primary hover:underline">
          {fa.common.viewAll} →
        </Link>
      </div>
    </section>
  );
}
