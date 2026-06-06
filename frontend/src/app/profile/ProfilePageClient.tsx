"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AccountLayout } from "@/components/account/AccountLayout";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import { fetchWallet } from "@/lib/api/wallet";
import { fetchOrders } from "@/lib/api/orders";
import { useEffect, useState } from "react";

export default function ProfilePageClient() {
  const { user, token, loading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchWallet(token)
      .then((w) => setBalance(w.balance))
      .catch(() => setBalance(null));
    fetchOrders(token)
      .then((orders) => setOrderCount(orders.length))
      .catch(() => setOrderCount(null));
  }, [token]);

  if (loading) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{fa.profile.loginRequired}</p>
        <Link href={routes.login} className="mt-4 inline-block text-primary hover:underline">
          {fa.header.loginRegister}
        </Link>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || fa.profile.notSet;

  return (
    <AccountLayout title={fa.profile.title} subtitle={fa.profile.subtitle}>
      <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="bg-gradient-to-l from-primary/15 via-primary/5 to-transparent px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-header-main text-3xl font-bold text-primary-foreground shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{fa.header.welcomeUser(user.username)}</p>
              <h2 className="mt-1 text-2xl font-bold">{fullName}</h2>
            </div>
          </div>
        </div>

        <dl className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <dt className="text-xs font-medium text-muted-foreground">{fa.profile.username}</dt>
            <dd className="mt-2 font-semibold" dir="ltr">
              {user.username}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <dt className="text-xs font-medium text-muted-foreground">{fa.profile.fullName}</dt>
            <dd className="mt-2 font-semibold">{fullName}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <h2 className="text-lg font-bold text-primary">{fa.profile.quickLinks}</h2>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={routes.wallet}
            className="group rounded-xl border border-border bg-background p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{fa.wallet.availableBalance}</p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {balance != null ? formatPrice(balance) : "—"}
            </p>
            <span className="mt-4 inline-block text-sm text-primary group-hover:underline">
              {fa.profile.wallet} →
            </span>
          </Link>

          <Link
            href={routes.orders}
            className="group rounded-xl border border-border bg-background p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{fa.profile.orders}</p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {orderCount != null ? fa.profile.ordersCount(orderCount) : "—"}
            </p>
            <span className="mt-4 inline-block text-sm text-primary group-hover:underline">
              {fa.orders.title} →
            </span>
          </Link>
        </div>
      </section>
    </AccountLayout>
  );
}
