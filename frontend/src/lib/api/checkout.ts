import { endpoints } from "@/lib/constants/endpoints";
import { apiFetchAuth } from "@/lib/api/client";
import type { AddressInput } from "@/lib/api/addresses";

type CheckoutPayload = {
  address_id?: number;
  address?: AddressInput;
};

type CheckoutResponse = {
  order_id: number;
  payment_url: string;
  detail: string;
};

export async function checkout(token: string, payload: CheckoutPayload): Promise<CheckoutResponse> {
  const frontend_origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return apiFetchAuth<CheckoutResponse>(endpoints.checkout, token, {
    method: "POST",
    body: JSON.stringify({ ...payload, frontend_origin }),
  });
}
