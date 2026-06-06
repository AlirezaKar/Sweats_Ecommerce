"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchOrders } from "@/lib/api/orders";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { OrderListItem } from "@/types/api";

export default function OrdersPageClient() {
  const { user, token, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const paymentHandled = useRef(false);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment || paymentHandled.current) return;

    paymentHandled.current = true;
    const ref = searchParams.get("ref");
    const orderId = searchParams.get("order");
    window.history.replaceState(null, "", routes.orders);

    if (payment === "success") {
      setNoticeTone("success");
      setNotice(
        ref
          ? fa.orders.paymentSuccessRef(ref)
          : orderId
            ? fa.orders.paymentSuccessOrder(orderId)
            : fa.orders.paymentSuccess,
      );
      if (token) {
        fetchOrders(token).then(setOrders).catch(() => {});
      }
    } else if (payment === "canceled") {
      setNoticeTone("info");
      setNotice(fa.orders.paymentCanceled);
    } else if (payment === "failed") {
      setNoticeTone("error");
      setNotice(fa.orders.paymentFailed);
    } else {
      setNoticeTone("error");
      setNotice(fa.orders.paymentInvalid);
    }
  }, [searchParams, token]);

  if (authLoading || loading) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{fa.orders.loginRequired}</p>
        <Link
          href={`${routes.login}?next=${encodeURIComponent(routes.orders)}`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {fa.header.loginRegister}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-primary">{fa.orders.title}</h1>

      {notice ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            noticeTone === "success"
              ? "bg-accent/10 text-accent"
              : noticeTone === "error"
                ? "text-sale"
                : "text-muted-foreground"
          }`}
        >
          {notice}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{fa.orders.empty}</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-border bg-background p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{fa.orders.orderNumber(order.id)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    order.is_paid ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {order.status_label}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>
                  {fa.orders.items}: {order.item_count}
                </span>
                <span className="font-semibold text-primary">{formatPrice(order.total_price)}</span>
                {order.tracking_code ? (
                  <span dir="ltr">{fa.orders.tracking}: {order.tracking_code}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
