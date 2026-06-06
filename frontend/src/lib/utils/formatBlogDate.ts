import { LOCALE } from "@/lib/constants/locale";

/** Full Persian date e.g. «۲۵ تیر ۱۳۹۸» */
export function formatBlogDateFull(iso: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
