"use client";

import { fa } from "@/lib/i18n/fa";
import { CarouselFrame } from "@/components/ui/CarouselFrame";
import { useHorizontalCarousel } from "@/lib/hooks/useHorizontalCarousel";
import { TutorialClipCard } from "./TutorialClipCard";
import type { Tutorial } from "@/types/api";

type Props = { clips: Tutorial[] };

export function TutorialClipsCarousel({ clips }: Props) {
  const {
    trackRef,
    activePage,
    pageCount,
    scrollToPage,
    scrollByPage,
    onTouchStart,
    onTouchEnd,
    trackClassName,
  } = useHorizontalCarousel({
    itemCount: clips.length,
    cardSelector: "[data-clip-card]",
  });

  if (clips.length === 0) return null;

  return (
    <section>
      <div className="mb-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <h2 className="text-xl font-bold text-primary">{fa.tutorials.clipsTitle}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>

      <CarouselFrame
        trackRef={trackRef}
        trackClassName={trackClassName}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        activePage={activePage}
        pageCount={pageCount}
        scrollToPage={scrollToPage}
        scrollByPage={scrollByPage}
      >
        {clips.map((clip) => (
          <div
            key={clip.id}
            data-clip-card
            className="group w-[85vw] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <TutorialClipCard clip={clip} className="h-full" />
          </div>
        ))}
      </CarouselFrame>
    </section>
  );
}
