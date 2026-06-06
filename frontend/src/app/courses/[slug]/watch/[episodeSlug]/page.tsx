import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseEpisodeList } from "@/components/courses/CourseEpisodeList";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { CourseWatchTracker } from "@/components/courses/CourseWatchTracker";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { fetchCourse } from "@/lib/api/courses";
import { ApiError } from "@/lib/api/client";

type Props = { params: Promise<{ slug: string; episodeSlug: string }> };

export default async function CourseWatchPage({ params }: Props) {
  const { slug, episodeSlug } = await params;

  let course;
  try {
    course = await fetchCourse(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const episode = course.episodes.find((e) => e.slug === episodeSlug);
  if (!episode) notFound();

  const episodeIndex = course.episodes.findIndex((e) => e.slug === episodeSlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <CourseWatchTracker
        courseSlug={slug}
        episodeSlug={episodeSlug}
        episodeCount={course.episodes.length}
      />
      <nav className="mb-4 truncate text-sm text-muted-foreground">
        <Link href={routes.courses} className="hover:text-primary">
          {fa.nav.courses}
        </Link>
        {" / "}
        <Link href={routes.course(slug)} className="hover:text-primary">
          {course.title}
        </Link>
        {" / "}
        <span className="text-foreground">{episode.title}</span>
      </nav>

      {/* RTL: player first = right, episode list second = left */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-8">
          <VideoPlayer url={episode.video_url} title={episode.title} />
          <div>
            <p className="text-sm text-muted-foreground">
              {fa.courses.session} {episodeIndex + 1} {fa.courses.of} {course.episodes.length}
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">{episode.title}</h1>
            {episode.description && (
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{episode.description}</p>
            )}
          </div>

          <CourseMaterials courseSlug={slug} />

          <div className="flex flex-wrap gap-3">
            {episodeIndex > 0 && (
              <Link
                href={routes.courseWatch(slug, course.episodes[episodeIndex - 1].slug)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                ← {fa.courses.prevSession}
              </Link>
            )}
            {episodeIndex < course.episodes.length - 1 && (
              <Link
                href={routes.courseWatch(slug, course.episodes[episodeIndex + 1].slug)}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary-dark"
              >
                {fa.courses.nextSession} →
              </Link>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <CourseEpisodeList
            courseSlug={slug}
            episodes={course.episodes}
            currentEpisodeSlug={episodeSlug}
          />
        </div>
      </div>
    </div>
  );
}
