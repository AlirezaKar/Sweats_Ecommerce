import type { Metadata } from "next";
import Link from "next/link";
import { aboutSections } from "@/content/about";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { organizationSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = buildPageMetadata({
  title: fa.footer.aboutTitle,
  description: fa.footer.aboutText,
  path: routes.about,
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.footer.aboutTitle}</h1>
        <p className="mt-3 text-muted-foreground">{fa.about.subtitle}</p>
      </div>

      <p className="mb-10 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm leading-8 text-muted-foreground">
        {fa.footer.aboutText}
      </p>

      <div className="space-y-8">
        {aboutSections.map((section) => (
          <section key={section.id}>
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-8 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 text-center">
        <p className="text-sm text-muted-foreground">{fa.about.contactPrompt}</p>
        <Link
          href={routes.contact}
          className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          {fa.nav.contact}
        </Link>
      </div>
      </div>
    </>
  );
}
