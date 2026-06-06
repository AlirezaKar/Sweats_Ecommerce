import type { Metadata } from "next";
import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { notFound } from "next/navigation";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import { fetchCourse } from "@/lib/api/courses";
import { ApiError } from "@/lib/api/client";
import { buildPageMetadata, truncateDescription } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { breadcrumbSchema, courseSchema } from "@/lib/seo/schemas";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const course = await fetchCourse(slug);
    return buildPageMetadata({
      title: course.title,
      description: truncateDescription(course.description.replace(/<[^>]+>/g, " ")),
      path: routes.course(slug),
      image: course.thumbnail,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return buildPageMetadata({
        title: "دوره یافت نشد",
        description: "این دوره در شیرینی‌خانه موجود نیست.",
        path: routes.course(slug),
        index: false,
      });
    }
    throw err;
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  let course;
  try {
    course = await fetchCourse(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const firstEpisode = course.episodes[0];

  const hours = Math.max(1, Math.round(course.total_duration_minutes / 60));

  return (
    <>
      <JsonLd
        data={[
          courseSchema(course),
          breadcrumbSchema([
            { name: "خانه", path: routes.home },
            { name: fa.nav.courses, path: routes.courses },
            { name: course.title, path: routes.course(slug) },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href={routes.home} className="hover:text-primary">
          خانه
        </Link>
        {" / "}
        <Link href={routes.courses} className="hover:text-primary">
          {fa.nav.courses}
        </Link>
        {" / "}
        <span className="text-foreground">{course.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            {course.thumbnail ? (
              <MediaImage
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">بدون تصویر</div>
            )}
          </div>

          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{course.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {fa.courses.instructor}: {course.instructor_name}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-muted px-3 py-1">{course.level_label}</span>
            <span className="rounded-full bg-muted px-3 py-1">
              {course.episode_count} {fa.courses.episodes}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              ~{hours} {fa.courses.hours}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-primary-foreground ${
                course.is_free ? "bg-accent" : "bg-primary"
              }`}
            >
              {course.is_free ? fa.courses.free : course.price != null ? formatPrice(course.price) : ""}
            </span>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold">{fa.courses.about}</h2>
            <BlogArticleBody body={course.description} />
          </div>

          <div className="mt-8">
            <CourseMaterials courseSlug={slug} />
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 lg:sticky lg:top-24">
            <h2 className="font-bold">{fa.courses.curriculum}</h2>
            <ol className="mt-4 space-y-2">
              {course.episodes.map((episode, index) => (
                <li key={episode.id}>
                  <Link
                    href={routes.courseWatch(slug, episode.slug)}
                    className="flex gap-3 rounded-lg px-2 py-2 text-sm hover:bg-background"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2">{episode.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {episode.duration_minutes} {fa.courses.minutes}
                        {episode.is_preview ? ` · ${fa.courses.preview}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {firstEpisode && (
              <Link
                href={routes.courseWatch(slug, firstEpisode.slug)}
                className="touch-target mt-6 block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary-dark"
              >
                {fa.courses.startLearning}
              </Link>
            )}
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
