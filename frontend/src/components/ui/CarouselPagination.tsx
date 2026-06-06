type DotsProps = {
  pageCount: number;
  activePage: number;
  onPageChange: (page: number) => void;
};

export function CarouselPagination({ pageCount, activePage, onPageChange }: DotsProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {Array.from({ length: pageCount }).map((_, index) => {
        const active = index === activePage;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onPageChange(index)}
            className={`h-2 rounded-full transition-all ${
              active ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"
            }`}
            aria-label={`صفحه ${index + 1}`}
            aria-current={active ? "true" : undefined}
          />
        );
      })}
    </div>
  );
}

type ArrowProps = {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
};

export function CarouselArrow({ direction, disabled, onClick }: ArrowProps) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={isPrev ? "صفحه قبل" : "صفحه بعد"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d={isPrev ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
