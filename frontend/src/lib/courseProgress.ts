const STORAGE_KEY = "course_progress_v1";

export type CourseProgress = {
  watchedEpisodeSlugs: string[];
  lastEpisodeSlug?: string;
  enrolledAt: string;
  updatedAt: string;
};

type ProgressStore = Record<string, CourseProgress>;

function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getCourseProgress(courseSlug: string): CourseProgress | null {
  return readStore()[courseSlug] ?? null;
}

export function getCourseProgressPercent(courseSlug: string, episodeCount: number): number {
  if (episodeCount <= 0) return 0;
  const progress = getCourseProgress(courseSlug);
  if (!progress) return 0;
  const watched = new Set(progress.watchedEpisodeSlugs).size;
  return Math.min(100, Math.round((watched / episodeCount) * 100));
}

export function markEpisodeWatched(
  courseSlug: string,
  episodeSlug: string,
  episodeCount: number,
): CourseProgress {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store[courseSlug];
  const watched = new Set(existing?.watchedEpisodeSlugs ?? []);
  watched.add(episodeSlug);

  const next: CourseProgress = {
    watchedEpisodeSlugs: Array.from(watched),
    lastEpisodeSlug: episodeSlug,
    enrolledAt: existing?.enrolledAt ?? now,
    updatedAt: now,
  };

  store[courseSlug] = next;
  writeStore(store);
  window.dispatchEvent(new CustomEvent("course-progress-updated", { detail: { courseSlug } }));
  return next;
}

export function getContinueEpisodeSlug(
  courseSlug: string,
  firstEpisodeSlug: string | null,
): string | null {
  const progress = getCourseProgress(courseSlug);
  if (progress?.lastEpisodeSlug) return progress.lastEpisodeSlug;
  return firstEpisodeSlug;
}

export function listCoursesWithProgress(): string[] {
  return Object.keys(readStore());
}
