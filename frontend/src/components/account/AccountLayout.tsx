import Link from "next/link";
import type { ReactNode } from "react";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { AccountSidebar } from "@/components/account/AccountSidebar";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/** RTL account shell — sidebar on the right, content on the left (Persian dashboard layout). */
export function AccountLayout({ title, subtitle, children }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href={routes.home} className="hover:text-primary">
          {fa.nav.home}
        </Link>
        {" / "}
        <span className="text-foreground">{title}</span>
      </nav>

      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8 xl:col-span-9">{children}</div>
        <aside className="lg:col-span-4 xl:col-span-3">
          <AccountSidebar />
        </aside>
      </div>
    </div>
  );
}
