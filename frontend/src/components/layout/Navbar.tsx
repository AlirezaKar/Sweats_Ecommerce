"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { mainNavLinks } from "@/lib/constants/navigation";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import type { Category } from "@/types/api";

type Props = { categories: Category[] };

export function Navbar({ categories }: Props) {
  const pathname = usePathname();

  return (
    <nav className="relative bg-header-nav text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <MegaMenu categories={categories} />
        </div>

        <MobileNav navLinks={mainNavLinks} categories={categories} />

        <ul className="hidden flex-1 flex-wrap items-center gap-1 lg:flex lg:gap-4">
          {mainNavLinks.map(({ href, label }) => {
            const active =
              href === routes.home
                ? pathname === routes.home
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded px-2 py-1.5 text-sm transition hover:bg-white/10 ${
                    active ? "bg-white/15 font-medium" : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
