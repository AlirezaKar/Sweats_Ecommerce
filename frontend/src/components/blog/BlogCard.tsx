import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatBlogDateFull } from "@/lib/utils/formatBlogDate";
import type { BlogPostListItem } from "@/types/api";

type Props = {
  post: BlogPostListItem;
  className?: string;
};

export function BlogCard({ post, className = "" }: Props) {
  const date = formatBlogDateFull(post.published_at);

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md ${className}`}
    >
      <Link href={routes.blogPost(post.slug)} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {post.thumbnail ? (
            <MediaImage
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width:640px) 85vw, (max-width:1024px) 45vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              بدون تصویر
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={routes.blogPost(post.slug)}>
          <h3 className="line-clamp-2 text-base font-bold leading-7 text-foreground sm:text-lg">
            {post.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-muted-foreground">
          {fa.blog.by}{" "}
          <span className="font-medium text-[#8a9a5b]">{post.author_name}</span>
          {" / "}
          <span>{date}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <Link
            href={routes.blogPost(post.slug)}
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {fa.blog.readMore}
          </Link>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CommentIcon />
            {post.comment_count}
          </span>
        </div>
      </div>
    </article>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
