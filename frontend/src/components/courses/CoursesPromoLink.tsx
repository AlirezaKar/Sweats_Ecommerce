import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

type Props = {
  className?: string;
};

/** Small cross-link from tutorials to the full courses catalog. */
export function CoursesPromoLink({ className = "" }: Props) {
  return (
    <Link
      href={routes.courses}
      className={`inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 ${className}`}
    >
      {fa.tutorials.coursesPromo}
      <span aria-hidden>→</span>
    </Link>
  );
}
