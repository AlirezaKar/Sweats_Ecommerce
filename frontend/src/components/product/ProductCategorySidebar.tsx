import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  activeSlug?: string;
};

function buildCategoryTree(categories: Category[]) {
  const topLevel = categories
    .filter((c) => c.parent == null)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fa"));

  const childrenByParent = new Map<number, Category[]>();
  for (const cat of categories) {
    if (cat.parent == null) continue;
    const list = childrenByParent.get(cat.parent) ?? [];
    list.push(cat);
    childrenByParent.set(cat.parent, list);
  }
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fa"));
  }

  return topLevel.map((parent) => ({
    parent,
    children: childrenByParent.get(parent.id) ?? [],
  }));
}

export function ProductCategorySidebar({ categories, activeSlug }: Props) {
  const tree = buildCategoryTree(categories);

  return (
    <nav
      className="rounded-xl border border-border bg-background p-4 shadow-sm lg:sticky lg:top-28"
      aria-label={fa.shop.categoryFilter}
    >
      <h2 className="mb-3 text-sm font-bold text-foreground">{fa.shop.categoryFilter}</h2>
      <ul className="space-y-1 text-sm">
        <li>
          <Link
            href={routes.products}
            className={`block rounded-lg px-3 py-2 transition ${
              !activeSlug
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {fa.shop.allProducts}
          </Link>
        </li>
        {tree.map(({ parent, children }) => (
          <li key={parent.id}>
            <Link
              href={`${routes.products}?category=${encodeURIComponent(parent.slug)}`}
              className={`block rounded-lg px-3 py-2 transition ${
                activeSlug === parent.slug
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {parent.name}
            </Link>
            {children.length > 0 ? (
              <ul className="mt-1 space-y-0.5 border-s border-border ps-3">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`${routes.products}?category=${encodeURIComponent(child.slug)}`}
                      className={`block rounded-lg px-3 py-1.5 text-xs transition ${
                        activeSlug === child.slug
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
