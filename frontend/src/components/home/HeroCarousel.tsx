import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

const slides = [
  { id: 1, title: "شیرینی تازه، درب منزل", cta: "مشاهده فروشگاه", href: routes.products },
  { id: 2, title: "مناسبتی و هدیه", cta: "بسته‌های ویژه", href: routes.products },
] as const;

export function HeroCarousel() {
  return (
    <section className="relative bg-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16 md:py-24 lg:px-8">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{slides[0].title}</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">{fa.header.promo}</p>
        <Link
          href={slides[0].href}
          className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          {slides[0].cta}
        </Link>
        <div className="mt-8 flex gap-2">
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={`h-2 w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
