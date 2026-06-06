import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { AccountLink } from "./AccountLink";
import { CartBadge } from "./CartBadge";
import { WalletBadge } from "./WalletBadge";
import { SearchForm } from "./SearchForm";

export function HeaderMain() {
  return (
    <div className="sticky top-0 z-50 bg-header-main text-primary-foreground shadow-md">
      {/* Phone / small tablet */}
      <div className="space-y-3 px-4 py-3 lg:hidden">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Link
            href={routes.home}
            className="truncate text-lg font-bold tracking-tight text-white sm:text-xl"
          >
            {fa.common.siteName}
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CartBadge />
            <WalletBadge />
            <AccountLink />
          </div>
        </div>
        <SearchForm className="w-full" />
      </div>

      {/* Laptop / desktop */}
      <div className="mx-auto hidden max-w-7xl flex-wrap items-center gap-4 px-6 py-4 lg:flex lg:px-8">
        <Link
          href={routes.home}
          className="order-1 shrink-0 text-2xl font-bold tracking-tight text-white"
        >
          {fa.common.siteName}
        </Link>

        <SearchForm className="order-3 flex w-full flex-1 items-center lg:order-2 lg:mx-auto lg:max-w-xl" />

        <div className="order-2 flex shrink-0 items-center gap-3 text-sm lg:order-3 lg:mr-auto lg:ml-0">
          <CartBadge />
          <WalletBadge />
          <AccountLink
            className="rounded-lg px-3 py-1.5 hover:bg-white/10"
            textClassName="text-sm"
            showIconOnMobile={false}
          />
        </div>
      </div>
    </div>
  );
}
