"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  placement?: "top" | "bottom";
};

export function MegaMenu({ categories, placement = "top" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isBottom = placement === "bottom";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  useEffect(() => {
    if (!open || !isBottom) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isBottom]);

  const topLevel = categories.filter((c) => c.parent == null);

  return (
    <div ref={ref} className={isBottom ? "relative w-full" : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isBottom
            ? "flex w-full items-center justify-center gap-2 py-3 text-sm font-medium hover:bg-white/10"
            : "flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MenuIcon />
        <span className={isBottom ? "" : "max-w-[8rem] truncate sm:max-w-none"}>
          {fa.header.categories}
        </span>
        <ChevronIcon open={open} upward={isBottom} />
      </button>

      {open && isBottom ? (
        <button
          type="button"
          className="fixed inset-x-0 top-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-40 bg-black/40"
          aria-label={fa.common.close}
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <div
          className={
            isBottom
              ? "absolute inset-x-0 bottom-full z-50 mb-0 max-h-[min(70dvh,28rem)] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 text-foreground shadow-2xl"
              : "absolute start-0 top-full z-50 mt-1 w-[min(calc(100vw-2rem),36rem)] rounded-lg border border-border bg-background p-4 text-foreground shadow-xl"
          }
        >
          {topLevel.length === 0 ? (
            <p className="text-sm text-muted-foreground">دسته‌بندی‌ای وجود ندارد.</p>
          ) : (
            <div
              className={
                isBottom
                  ? "grid grid-cols-2 gap-1 sm:grid-cols-3"
                  : "grid grid-cols-1 gap-1 xs:grid-cols-2 sm:grid-cols-3"
              }
            >
              {topLevel.map((cat) => (
                <Link
                  key={cat.id}
                  href={`${routes.products}?category=${cat.slug}`}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-border pt-3">
            <Link
              href={routes.products}
              className="text-sm text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {fa.common.viewAll} →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function ChevronIcon({ open, upward }: { open: boolean; upward?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition ${open ? (upward ? "" : "rotate-180") : upward ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
