"use client";

import { useEffect } from "react";
import { markEpisodeWatched } from "@/lib/courseProgress";

type Props = {
  courseSlug: string;
  episodeSlug: string;
  episodeCount: number;
};

export function CourseWatchTracker({ courseSlug, episodeSlug, episodeCount }: Props) {
  useEffect(() => {
    markEpisodeWatched(courseSlug, episodeSlug, episodeCount);
  }, [courseSlug, episodeSlug, episodeCount]);

  return null;
}
