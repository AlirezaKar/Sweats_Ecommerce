"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AccountLayout } from "@/components/account/AccountLayout";
import { fetchWallet, fetchWalletTransactions, topUpWallet } from "@/lib/api/wallet";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Wallet, WalletTransaction } from "@/types/api";

type PaymentNotice = {
  payment: string;
  ref?: string | null;
};

export default function WalletPageClient() {
  const { user, token, loading } = useAuth();
  const searchParams = useSearchParams();
  const paymentHandled = useRef(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState("50000");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");

  async function reload(authToken: string) {
    const [w, txs] = await Promise.all([
      fetchWallet(authToken),
      fetchWalletTransactions(authToken),
    ]);
    setWallet(w);
    setTransactions(txs);
  }

  useEffect(() => {
    if (loading || !token) return;
    reload(token).catch(() => {});
  }, [loading, token]);

  useEffect(() => {
    if (loading) return;

    let notice: PaymentNotice | null = null;
    const payment = searchParams.get("payment");

    if (payment) {
      notice = { payment, ref: searchParams.get("ref") };
      window.history.replaceState(null, "", routes.wallet);
    }

    if (!notice || paymentHandled.current) return;

    paymentHandled.current = true;
    applyPaymentNotice(notice);

    if (notice.payment === "success" && token) {
      reload(token).catch(() => {});
    }
  }, [loading, searchParams, token]);

  function applyPaymentNotice(notice: PaymentNotice) {
    const ref = notice.ref;
    if (notice.payment === "success") {
      setMessageTone("success");
      setMessage(ref ? fa.wallet.paymentSuccessRef(ref) : fa.wallet.paymentSuccess);
    } else if (notice.payment === "canceled") {
      setMessageTone("info");
      setMessage(fa.wallet.paymentCanceled);
    } else if (notice.payment === "failed") {
      setMessageTone("error");
      setMessage(fa.wallet.paymentFailed);
    } else {
      setMessageTone("error");
      setMessage(fa.wallet.paymentInvalid);
    }
  }

  async function handleTopUp(e: FormEvent, instant: boolean) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage("");
    try {
      const value = parseInt(amount, 10);
      const result = await topUpWallet(token, value, instant);

      if (instant || !result.payment_url) {
        setMessageTone("success");
        setMessage(fa.wallet.instantSuccess);
        await reload(token);
        return;
      }

      window.location.assign(result.payment_url);
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{fa.wallet.loginRequired}</p>
        <Link href={routes.login} className="mt-4 inline-block text-primary hover:underline">
          {fa.header.loginRegister}
        </Link>
      </div>
    );
  }

  const pendingCount = transactions.filter(
    (tx) => tx.status === "pending" && tx.tx_type === "top_up",
  ).length;

  const messageClass =
    messageTone === "success"
      ? "text-accent"
      : messageTone === "error"
        ? "text-sale"
        : "text-muted-foreground";

  return (
    <AccountLayout title={fa.wallet.title} subtitle={fa.wallet.subtitle}>
      <div className="rounded-xl border border-border bg-gradient-to-l from-primary/10 to-background p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">{fa.wallet.availableBalance}</p>
        <p className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
          {formatPrice(wallet?.balance ?? 0)}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{fa.wallet.balanceHint}</p>
      </div>

      <form
        className="mt-8 rounded-xl border border-border bg-background p-6 shadow-sm"
        onSubmit={(e) => handleTopUp(e, false)}
      >
        <h2 className="text-lg font-bold">{fa.wallet.topUp}</h2>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm leading-7 text-muted-foreground">
          {fa.wallet.depositSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <label className="mt-6 block text-sm font-medium">{fa.wallet.amount}</label>
        <input
          type="number"
          min={1000}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5"
          required
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="touch-target rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
          >
            {fa.wallet.payOnline}
          </button>
          {process.env.NODE_ENV === "development" ? (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => handleTopUp(e as unknown as FormEvent, true)}
              className="rounded-lg border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {fa.wallet.instantTopUp}
            </button>
          ) : null}
        </div>

        {message ? <p className={`mt-4 text-sm ${messageClass}`}>{message}</p> : null}
      </form>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{fa.wallet.history}</h2>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {fa.wallet.pendingCount(pendingCount)}
            </span>
          ) : null}
        </div>

        {transactions.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            {fa.wallet.noTransactions}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{tx.tx_type_label}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {tx.description || tx.status_label}
                    {tx.reference_code ? (
                      <span className="ms-2 font-mono text-xs" dir="ltr">
                        ({tx.reference_code})
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={tx.amount >= 0 ? "font-semibold text-accent" : "font-semibold text-sale"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {formatPrice(Math.abs(tx.amount))}
                  </span>
                  <StatusBadge status={tx.status} label={tx.status_label} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountLayout>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles =
    status === "completed"
      ? "bg-accent/10 text-accent"
      : status === "pending"
        ? "bg-muted text-muted-foreground"
        : "bg-sale/10 text-sale";

  return <span className={`rounded px-2 py-0.5 text-xs ${styles}`}>{label}</span>;
}
