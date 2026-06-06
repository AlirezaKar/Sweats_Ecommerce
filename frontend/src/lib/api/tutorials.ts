import { endpoints, detailFetchOptions } from "@/lib/constants/endpoints";
import { apiFetch, fetchPaginated } from "@/lib/api/client";
import type { Tutorial } from "@/types/api";

export async function fetchTutorials(page_size = 12): Promise<Tutorial[]> {
  return fetchPaginated<Tutorial>(endpoints.tutorials, { page_size });
}

export async function fetchTutorial(slug: string): Promise<Tutorial> {
  return apiFetch<Tutorial>(endpoints.tutorial(slug), undefined, detailFetchOptions);
}
