import { endpoints } from "@/lib/constants/endpoints";
import { apiFetchAuth } from "@/lib/api/client";
import type { OrderDetail, OrderListItem } from "@/types/api";

export async function fetchOrders(token: string): Promise<OrderListItem[]> {
  return apiFetchAuth<OrderListItem[]>(endpoints.orders, token);
}

export async function fetchOrder(token: string, id: number): Promise<OrderDetail> {
  return apiFetchAuth<OrderDetail>(endpoints.order(id), token);
}
