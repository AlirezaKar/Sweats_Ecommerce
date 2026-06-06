import { endpoints } from "@/lib/constants/endpoints";
import { apiFetchAuth } from "@/lib/api/client";
import type { Address } from "@/types/api";

export type AddressInput = {
  title: string;
  province: string;
  city: string;
  postal_address: string;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  is_default?: boolean;
};

export async function fetchAddresses(token: string): Promise<Address[]> {
  return apiFetchAuth<Address[]>(endpoints.addresses, token);
}

export async function createAddress(token: string, payload: AddressInput): Promise<Address> {
  return apiFetchAuth<Address>(endpoints.addresses, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
