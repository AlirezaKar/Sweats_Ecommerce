"use client";

import { MegaMenu } from "@/components/layout/MegaMenu";
import type { Category } from "@/types/api";

type Props = { categories: Category[] };

export function MobileCategoryBar({ categories }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-header-nav text-primary-foreground lg:hidden">
      <div className="mx-auto max-w-7xl px-4 pb-[env(safe-area-inset-bottom,0px)]">
        <MegaMenu categories={categories} placement="bottom" />
      </div>
    </div>
  );
}
