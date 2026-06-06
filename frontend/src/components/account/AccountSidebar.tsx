"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/context/AuthContext";

const baseNavItems = [
  { href: routes.profile, label: fa.profile.overview, icon: UserIcon },
  { href: routes.wallet, label: fa.profile.wallet, icon: WalletIcon },
  { href: routes.orders, label: fa.profile.orders, icon: OrdersIcon },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const navItems = user?.is_superuser
    ? [
        ...baseNavItems,
        { href: routes.profileBackup, label: fa.profile.backup, icon: BackupIcon },
      ]
    : [...baseNavItems];

  async function handleLogout() {
    await logout();
    router.push(routes.home);
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      {user ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">{fa.header.welcomeUser(user.username)}</p>
          <p className="mt-1 truncate font-semibold" dir="ltr">
            {user.username}
          </p>
        </div>
      ) : null}

      <nav className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <p className="border-b border-border bg-header-main px-4 py-3 text-sm font-semibold text-primary-foreground">
          {fa.profile.title}
        </p>
        <ul className="p-2">
          {navItems.map((item) => {
            const { href, label, icon: Icon } = item;
            const active = pathname === href;

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg border-s-4 px-3 py-2.5 text-sm transition ${
                    active
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-transparent text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon active={active} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sale transition hover:bg-sale/5"
          >
            <LogoutIcon />
            {fa.profile.logout}
          </button>
        </div>
      </nav>

      <div className="rounded-xl border border-border bg-accent/5 p-4 text-sm leading-7">
        <p className="font-semibold text-accent">{fa.footer.support}</p>
        <p className="mt-1 text-muted-foreground">{fa.footer.aboutText.slice(0, 80)}…</p>
        <a href={`tel:${fa.header.phoneHref}`} dir="ltr" className="mt-2 block font-medium text-primary hover:underline">
          {fa.header.phone}
        </a>
      </div>
    </div>
  );
}

function UserIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={active ? "text-primary" : "text-muted-foreground"} aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function WalletIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={active ? "text-primary" : "text-muted-foreground"} aria-hidden>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function OrdersIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={active ? "text-primary" : "text-muted-foreground"} aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function BackupIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={active ? "text-primary" : "text-muted-foreground"} aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
