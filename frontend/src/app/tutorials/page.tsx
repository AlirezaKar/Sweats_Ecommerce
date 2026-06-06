import Link from "next/link";
import { TutorialClipsCarousel } from "@/components/tutorials/TutorialClipsCarousel";
import { CoursesPromoLink } from "@/components/courses/CoursesPromoLink";
import { fa } from "@/lib/i18n/fa";
import { fetchTutorials } from "@/lib/api/tutorials";

export default async function TutorialsPage() {
  const clips = await fetchTutorials(12).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:text-start">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.tutorials.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{fa.tutorials.subtitle}</p>
      </div>

      {clips.length === 0 ? (
        <p className="text-center text-muted-foreground">{fa.tutorials.comingSoon}</p>
      ) : (
        <TutorialClipsCarousel clips={clips} />
      )}

      <div className="mt-12 flex justify-center border-t border-border pt-8">
        <CoursesPromoLink />
      </div>
    </div>
  );
}
