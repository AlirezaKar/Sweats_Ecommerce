import type { ReactNode, RefObject, TouchEvent } from "react";
import { CarouselArrow, CarouselPagination } from "@/components/ui/CarouselPagination";

type Props = {
  trackRef: RefObject<HTMLDivElement | null>;
  trackClassName: string;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  activePage: number;
  pageCount: number;
  scrollToPage: (page: number) => void;
  scrollByPage: (direction: -1 | 1) => void;
  children: ReactNode;
};

export function CarouselFrame({
  trackRef,
  trackClassName,
  onTouchStart,
  onTouchEnd,
  activePage,
  pageCount,
  scrollToPage,
  scrollByPage,
  children,
}: Props) {
  const showNav = pageCount > 1;
  const atStart = activePage <= 0;
  const atEnd = activePage >= pageCount - 1;

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {showNav && (
          <CarouselArrow direction="prev" disabled={atStart} onClick={() => scrollByPage(-1)} />
        )}

        <div
          ref={trackRef}
          className={`min-w-0 flex-1 ${trackClassName}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {children}
        </div>

        {showNav && (
          <CarouselArrow direction="next" disabled={atEnd} onClick={() => scrollByPage(1)} />
        )}
      </div>

      <CarouselPagination
        pageCount={pageCount}
        activePage={activePage}
        onPageChange={scrollToPage}
      />
    </>
  );
}
