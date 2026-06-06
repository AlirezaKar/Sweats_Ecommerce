"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";

const GAP_PX = 24;
const SWIPE_THRESHOLD_PX = 48;

type Options = {
  itemCount: number;
  cardSelector: string;
};

export function useHorizontalCarousel({ itemCount, cardSelector }: Options) {
  const trackRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(1);
  const touchStartX = useRef(0);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const getCards = useCallback(() => {
    const track = trackRef.current;
    if (!track) return [];
    return Array.from(track.querySelectorAll<HTMLElement>(cardSelector));
  }, [cardSelector]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const cards = getCards();
    if (!track || cards.length === 0 || itemCount === 0) return;

    const cardWidth = cards[0].offsetWidth;
    const step = cardWidth + GAP_PX;
    const visible = Math.max(1, Math.floor((track.clientWidth + GAP_PX) / step));
    visibleRef.current = visible;
    const pages = Math.max(1, Math.ceil(itemCount / visible));
    setPageCount(pages);

    const trackRect = track.getBoundingClientRect();
    let bestIndex = 0;
    let bestDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.right - trackRect.right);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const page = Math.min(Math.floor(bestIndex / visible), pages - 1);
    setActivePage(page);
  }, [getCards, itemCount]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    measure();
    track.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      track.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollToPage = useCallback(
    (page: number) => {
      const cards = getCards();
      if (cards.length === 0) return;

      const visible = visibleRef.current;
      const clamped = Math.max(0, Math.min(page, pageCount - 1));
      setActivePage(clamped);

      const cardIndex = Math.min(clamped * visible, cards.length - 1);
      cards[cardIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    },
    [getCards, pageCount],
  );

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      scrollToPage(activePage + direction);
    },
    [activePage, scrollToPage],
  );

  const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = touchStartX.current - endX;

      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

      if (delta > 0) {
        scrollByPage(1);
      } else {
        scrollByPage(-1);
      }
    },
    [scrollByPage],
  );

  return {
    trackRef,
    activePage,
    pageCount,
    scrollToPage,
    scrollByPage,
    onTouchStart,
    onTouchEnd,
    trackClassName:
      "flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  };
}
