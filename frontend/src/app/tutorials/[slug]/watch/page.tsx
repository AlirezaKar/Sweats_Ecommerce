import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { notFound } from "next/navigation";
import { CoursesPromoLink } from "@/components/courses/CoursesPromoLink";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { fetchTutorial } from "@/lib/api/tutorials";
import { ApiError } from "@/lib/api/client";

type Props = { params: Promise<{ slug: string }> };

export default async function TutorialWatchPage({ params }: Props) {
  const { slug } = await params;

  let clip;
  try {
    clip = await fetchTutorial(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[320px] w-full bg-muted sm:max-h-[380px]">
        {clip.thumbnail ? (
          <MediaImage
            src={clip.thumbnail}
            alt={clip.title}
            fill
            className="object-cover opacity-40"
            priority
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <nav className="mb-2 text-sm text-white/80">
            <Link href={routes.tutorials} className="hover:text-white">
              {fa.tutorials.clipsTitle}
            </Link>
            {" / "}
            <span>{clip.title}</span>
          </nav>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{clip.title}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-muted-foreground">
          {clip.duration_minutes} {fa.tutorials.duration}
        </p>

        <VideoPlayer url={clip.video_url} title={clip.title} />

        <div className="mt-4 flex justify-center sm:justify-start">
          <CoursesPromoLink />
        </div>

        <p className="mt-6 text-base leading-8 text-foreground/90">{clip.description}</p>

        <Link href={routes.tutorials} className="mt-8 inline-block text-primary hover:underline">
          ← {fa.tutorials.backToClips}
        </Link>
      </div>
    </article>
  );
}
