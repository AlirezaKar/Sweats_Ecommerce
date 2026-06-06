import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { CourseListItem } from "@/types/api";

type Props = { course: CourseListItem; className?: string };

export function CourseCard({ course, className = "" }: Props) {
  const hours = Math.max(1, Math.round(course.total_duration_minutes / 60));

  return (
    <article
      className={`overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md ${className}`}
    >
      <Link href={routes.course(course.slug)} className="block">
        <div className="relative aspect-video bg-muted">
          {course.thumbnail ? (
            <MediaImage
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-30">▶</div>
          )}
          <span
            className={`absolute start-3 top-3 rounded px-2 py-0.5 text-xs text-white ${
              course.is_free ? "bg-accent" : "bg-primary"
            }`}
          >
            {course.is_free ? fa.courses.free : course.price != null ? formatPrice(course.price) : ""}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-bold leading-7 sm:text-lg">{course.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {fa.courses.instructor}: {course.instructor_name}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{course.level_label}</span>
            <span>
              {course.episode_count} {fa.courses.episodes}
            </span>
            <span>
              ~{hours} {fa.courses.hours}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
