import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

export const mainNavLinks = [
  { href: routes.home, label: fa.nav.home },
  { href: routes.products, label: fa.nav.shop },
  { href: routes.courses, label: fa.nav.courses },
  { href: routes.tutorials, label: fa.nav.tutorials },
  { href: routes.blog, label: fa.nav.blog },
  { href: routes.faq, label: fa.nav.faq },
  { href: routes.contact, label: fa.nav.contact },
] as const;
