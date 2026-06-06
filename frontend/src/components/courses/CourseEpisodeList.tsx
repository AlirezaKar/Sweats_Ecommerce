import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { CourseEpisode } from "@/types/api";

type Props = {
  courseSlug: string;
  episodes: CourseEpisode[];
  currentEpisodeSlug: string;
};

export function CourseEpisodeList({ courseSlug, episodes, currentEpisodeSlug }: Props) {
  return (
    <aside className="rounded-xl border border-border bg-muted/30 lg:sticky lg:top-24">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-bold">{fa.courses.curriculum}</h2>
        <p className="text-xs text-muted-foreground">
          {episodes.length} {fa.courses.episodes}
        </p>
      </div>
      <ol className="max-h-[min(32rem,60vh)] overflow-y-auto p-2">
        {episodes.map((episode, index) => {
          const active = episode.slug === currentEpisodeSlug;
          return (
            <li key={episode.id}>
              <Link
                href={routes.courseWatch(courseSlug, episode.slug)}
                className={`flex gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "hover:bg-background"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold shadow-sm">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 leading-6">{episode.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {episode.duration_minutes} {fa.courses.minutes}
                    {episode.is_preview && ` · ${fa.courses.preview}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
