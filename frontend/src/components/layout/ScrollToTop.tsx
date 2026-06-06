"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="touch-target fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] start-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-lg hover:bg-muted sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="بازگشت به بالا"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}
