import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { notFound } from "next/navigation";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import { BlogComments } from "@/components/blog/BlogComments";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import { BlogCard } from "@/components/blog/BlogCard";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { fetchBlogPost, fetchBlogPosts } from "@/lib/api/blog";
import { ApiError } from "@/lib/api/client";
import { formatBlogDateFull } from "@/lib/utils/formatBlogDate";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  let related: Awaited<ReturnType<typeof fetchBlogPosts>> = [];
  try {
    post = await fetchBlogPost(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
  try {
    related = await fetchBlogPosts(4).then((posts) =>
      posts.filter((p) => p.slug !== slug).slice(0, 3),
    );
  } catch {
    related = [];
  }

  const date = formatBlogDateFull(post.published_at);

  return (
    <article>
      {/* Hero banner — SUPP-FIT style */}
      <div className="relative aspect-[21/9] max-h-[420px] w-full bg-muted sm:aspect-[21/8]">
        {post.thumbnail ? (
          <MediaImage
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            بدون تصویر
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href={routes.home} className="hover:text-primary">
            خانه
          </Link>
          {" / "}
          <Link href={routes.blog} className="hover:text-primary">
            {fa.nav.blog}
          </Link>
          {" / "}
          <span className="text-foreground">{post.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold leading-10 sm:text-3xl lg:text-4xl">
                {post.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>
                  {fa.blog.by}{" "}
                  <span className="font-medium text-[#8a9a5b]">{post.author_name}</span>
                </span>
                <span aria-hidden>•</span>
                <time dateTime={post.published_at}>{date}</time>
                <span aria-hidden>•</span>
                <span>
                  {post.comment_count} {fa.blog.comments}
                </span>
              </div>

              {post.excerpt && (
                <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-base leading-8 text-foreground/90">
                  {post.excerpt}
                </p>
              )}
            </header>

            <BlogArticleBody body={post.body} />
            <BlogComments slug={slug} comments={post.comments ?? []} />
          </div>

          <div className="lg:col-span-4">
            <BlogRelatedPosts posts={related} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-12 lg:hidden">
            <h2 className="mb-6 text-xl font-bold">{fa.blog.related}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {related.map((item) => (
                <BlogCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
