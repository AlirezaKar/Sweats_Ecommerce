import { endpoints, detailFetchOptions } from "@/lib/constants/endpoints";
import { apiFetch, fetchPaginated } from "@/lib/api/client";
import type { Category, ProductDetail, ProductListItem } from "@/types/api";

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>(endpoints.categories);
}

export async function fetchProducts(params?: {
  page_size?: number;
  category?: string;
  on_sale?: boolean;
}): Promise<ProductListItem[]> {
  return fetchPaginated<ProductListItem>(endpoints.products, {
    page_size: params?.page_size ?? 24,
    category: params?.category,
    on_sale: params?.on_sale ? "true" : undefined,
  });
}

export async function fetchProduct(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(endpoints.product(slug), undefined, detailFetchOptions);
}

export async function fetchRelatedProducts(slug: string): Promise<ProductListItem[]> {
  return apiFetch<ProductListItem[]>(endpoints.productRelated(slug), undefined, detailFetchOptions);
}
