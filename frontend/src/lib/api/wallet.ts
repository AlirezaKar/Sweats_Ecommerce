import { endpoints } from "@/lib/constants/endpoints";
import { apiFetchAuth } from "@/lib/api/client";
import type { Wallet, WalletTransaction } from "@/types/api";

export async function fetchWallet(token: string): Promise<Wallet> {
  return apiFetchAuth<Wallet>(endpoints.wallet, token);
}

export async function fetchWalletTransactions(token: string): Promise<WalletTransaction[]> {
  const data = await apiFetchAuth<{ results?: WalletTransaction[] } | WalletTransaction[]>(
    endpoints.walletTransactions,
    token,
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export type WalletTopUpResponse = {
  transaction: WalletTransaction;
  payment_url: string | null;
};

export async function topUpWallet(
  token: string,
  amount: number,
  confirmImmediately = false,
): Promise<WalletTopUpResponse> {
  const frontend_origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return apiFetchAuth<WalletTopUpResponse>(endpoints.walletTopUp, token, {
    method: "POST",
    body: JSON.stringify({
      amount,
      confirm_immediately: confirmImmediately,
      frontend_origin: frontend_origin,
    }),
  });
}

export async function payOrderWithWallet(token: string, orderId: number) {
  return apiFetchAuth(endpoints.walletPayOrder(orderId), token, { method: "POST" });
}
