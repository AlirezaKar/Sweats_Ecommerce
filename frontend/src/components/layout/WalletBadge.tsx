"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchWallet } from "@/lib/api/wallet";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { LOCALE } from "@/lib/constants/locale";
import type { Wallet } from "@/types/api";

function formatWalletNumber(n: number) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(n);
}

export function WalletBadge() {
  const { token, user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (!token) {
      setWallet(null);
      return;
    }
    const authToken = token;
    function load() {
      fetchWallet(authToken).then(setWallet).catch(() => setWallet(null));
    }
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [token]);

  const href = user ? routes.wallet : routes.login;
  const label = wallet
    ? `${formatWalletNumber(wallet.balance)} ${fa.common.currency}`
    : fa.header.walletGuest;

  return (
    <Link
      href={href}
      className="flex max-w-[9rem] items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/10 sm:max-w-none sm:gap-2"
      title={fa.wallet.title}
    >
      <WalletIcon />
      <span className="truncate text-xs sm:text-sm" dir="ltr">
        {label}
      </span>
    </Link>
  );
}

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="shrink-0"
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
