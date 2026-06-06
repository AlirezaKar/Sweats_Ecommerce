import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatBlogDateFull } from "@/lib/utils/formatBlogDate";
import type { BlogPostListItem } from "@/types/api";

type Props = { posts: BlogPostListItem[] };

export function BlogRelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <aside className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 lg:sticky lg:top-24">
      <h2 className="mb-4 text-lg font-bold">{fa.blog.related}</h2>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={routes.blogPost(post.slug)} className="group flex gap-3">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {post.thumbnail ? (
                  <MediaImage
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="80px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-6 group-hover:text-primary">
                  {post.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBlogDateFull(post.published_at)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href={routes.blog} className="mt-4 inline-block text-sm text-primary hover:underline">
        {fa.common.viewAll}
      </Link>
    </aside>
  );
}
