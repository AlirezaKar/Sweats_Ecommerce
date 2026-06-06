import { BlogCard } from "@/components/blog/BlogCard";
import { fa } from "@/lib/i18n/fa";
import { fetchBlogPosts } from "@/lib/api/blog";

export default async function BlogListPage() {
  const posts = await fetchBlogPosts(24).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.nav.blog}</h1>
        <span className="h-px flex-1 bg-border" />
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">مقاله‌ای یافت نشد.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
