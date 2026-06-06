import Link from "next/link";
import Image from "next/image";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { mainNavLinks } from "@/lib/constants/navigation";
import { footerTrustBadges } from "@/lib/constants/footer";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          {/* Right — brand */}
          <div>
            <Link href={routes.home} className="text-2xl font-bold text-primary">
              {fa.common.siteName}
            </Link>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {fa.footer.aboutText}
            </p>
          </div>

          {/* Middle — quick access */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{fa.footer.quickAccess}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">{fa.footer.support}: </span>
                <a href={`tel:${fa.header.phoneHref}`} dir="ltr" className="hover:text-primary">
                  {fa.header.phone}
                </a>
              </li>
              <li>
                <Link href={routes.about} className="hover:text-primary">
                  {fa.nav.about}
                </Link>
              </li>
              {mainNavLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Left — certification badges */}
          <div className="flex flex-col items-end justify-start text-end">
            <div className="flex flex-wrap justify-end gap-3">
              {footerTrustBadges.map(({ src, alt, href }) => (
                <a
                  key={src}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded border border-border bg-background"
                  aria-label={alt}
                >
                  <Image
                    src={src}
                    alt={alt}
                    width={80}
                    height={80}
                    className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {fa.common.siteName}
      </div>
    </footer>
  );
}
