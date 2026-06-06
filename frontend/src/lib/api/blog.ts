import { endpoints, detailFetchOptions } from "@/lib/constants/endpoints";
import { apiFetch, fetchPaginated } from "@/lib/api/client";
import type { BlogPostDetail, BlogPostListItem } from "@/types/api";

export async function fetchBlogPosts(page_size = 4): Promise<BlogPostListItem[]> {
  return fetchPaginated<BlogPostListItem>(endpoints.blog, { page_size });
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  return apiFetch<BlogPostDetail>(endpoints.blogPost(slug), undefined, detailFetchOptions);
}
