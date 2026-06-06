import Link from "next/link";
import { MediaImage } from "@/components/ui/MediaImage";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { Tutorial } from "@/types/api";

type Props = { clip: Tutorial; className?: string };

export function TutorialClipCard({ clip, className = "" }: Props) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md ${className}`}
    >
      <Link href={routes.tutorialWatch(clip.slug)} className="block">
        <div className="relative aspect-[16/10] bg-muted">
          {clip.thumbnail ? (
            <MediaImage
              src={clip.thumbnail}
              alt={clip.title}
              fill
              className="object-cover"
              sizes="(max-width:640px) 85vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-30">▶</div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary">
              ▶
            </span>
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={routes.tutorialWatch(clip.slug)}>
          <h3 className="line-clamp-2 text-base font-bold leading-7">{clip.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{clip.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {clip.duration_minutes} {fa.tutorials.duration}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <Link
            href={routes.tutorialWatch(clip.slug)}
            className="text-sm text-foreground underline-offset-4 hover:underline"
          >
            {fa.tutorials.watch}
          </Link>
          <PlayIcon />
        </div>
      </div>
    </article>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
