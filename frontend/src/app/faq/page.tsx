import type { Metadata } from "next";
import Link from "next/link";
import { faqIntro, faqItems } from "@/content/faq";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = buildPageMetadata({
  title: fa.faq.title,
  description: fa.faq.subtitle,
  path: routes.faq,
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageSchema()} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.faq.title}</h1>
        <p className="mt-3 text-muted-foreground">{fa.faq.subtitle}</p>
      </div>

      <p className="mb-8 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm leading-7 text-muted-foreground">
        {faqIntro}
      </p>

      <div className="space-y-3">
        {faqItems.map((item) => (
          <details
            key={item.id}
            className="group rounded-xl border border-border bg-background px-5 py-1 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none py-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span className="shrink-0 text-muted-foreground transition group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <p className="border-t border-border pb-4 pt-3 text-sm leading-7 text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">{fa.faq.placeholderNote}</p>

      <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 text-center">
        <p className="text-sm text-muted-foreground">{fa.faq.stillNeedHelp}</p>
        <Link
          href={routes.contact}
          className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          {fa.faq.contactUs}
        </Link>
      </div>
      </div>
    </>
  );
}
