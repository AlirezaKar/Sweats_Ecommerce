import type { Metadata } from "next";
import { contactIntro } from "@/content/contact";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { organizationSchema } from "@/lib/seo/schemas";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: fa.nav.contact,
  description: contactIntro,
  path: routes.contact,
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <ContactPageClient />
    </>
  );
}
