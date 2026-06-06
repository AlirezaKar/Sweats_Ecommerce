"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { Category } from "@/types/api";

type NavLink = { href: string; label: string };

type Props = {
  navLinks: readonly NavLink[];
  categories: Category[];
};

export function MobileNav({ navLinks, categories }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const topLevelCategories = useMemo(
    () => categories.filter((category) => category.parent == null),
    [categories],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
        aria-label="منوی موبایل"
        aria-expanded={open}
      >
        <MenuIcon />
        <span className="hidden xs:inline">منو</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40"
            aria-label={fa.common.close}
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed inset-y-0 start-0 z-[70] flex w-[min(100vw-3rem,20rem)] flex-col bg-background text-foreground shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="font-bold">{fa.common.siteName}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
                aria-label={fa.common.close}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">صفحات</p>
              <ul className="space-y-1">
                {navLinks.map(({ href, label }) => {
                  const active =
                    href === routes.home ? pathname === routes.home : pathname.startsWith(href);
                  const isShop = href === routes.products;

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`block rounded-lg px-3 py-2.5 text-sm ${
                          active ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                        }`}
                      >
                        {label}
                      </Link>

                      {isShop ? (
                        <div className="mt-1 border-s-2 border-border ps-3 pb-1">
                          <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            {fa.header.categories}
                          </p>
                          {topLevelCategories.length === 0 ? (
                            <p className="px-3 py-1 text-xs text-muted-foreground">
                              دسته‌بندی‌ای وجود ندارد.
                            </p>
                          ) : (
                            <ul className="space-y-0.5">
                              {topLevelCategories.map((category) => (
                                <li key={category.id}>
                                  <Link
                                    href={`${routes.products}?category=${category.slug}`}
                                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                                  >
                                    {category.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                          <Link
                            href={routes.products}
                            className="mt-1 block px-3 py-2 text-xs text-primary hover:underline"
                          >
                            {fa.common.viewAll} →
                          </Link>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
