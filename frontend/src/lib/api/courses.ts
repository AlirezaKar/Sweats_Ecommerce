import { endpoints } from "@/lib/constants/endpoints";
import { apiFetch, apiFetchAuth, fetchPaginated } from "@/lib/api/client";
import type { CourseDetail, CourseFile, CourseListItem, CourseReview } from "@/types/api";

export async function fetchCourses(page_size = 48, token?: string | null): Promise<CourseListItem[]> {
  if (token) {
    const data = await apiFetchAuth<{ results?: CourseListItem[] } | CourseListItem[]>(
      endpoints.courses,
      token,
      { revalidate: false },
    );
    if (Array.isArray(data)) return data;
    return data.results ?? [];
  }
  return fetchPaginated<CourseListItem>(endpoints.courses, { page_size });
}

export async function fetchCourse(slug: string, token?: string | null): Promise<CourseDetail> {
  const { detailFetchOptions } = await import("@/lib/constants/endpoints");
  if (token) {
    return apiFetchAuth<CourseDetail>(endpoints.course(slug), token, detailFetchOptions);
  }
  return apiFetch<CourseDetail>(endpoints.course(slug), undefined, detailFetchOptions);
}

type EnrollResponse = {
  enrolled: boolean;
  already_enrolled?: boolean;
  payment_url?: string | null;
  detail: string;
};

export async function fetchCourseFiles(token: string, slug: string): Promise<CourseFile[]> {
  return apiFetchAuth<CourseFile[]>(endpoints.courseFiles(slug), token, {
    revalidate: false,
  });
}

export async function enrollCourse(token: string, slug: string): Promise<EnrollResponse> {
  const frontend_origin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return apiFetchAuth<EnrollResponse>(endpoints.courseEnroll(slug), token, {
    method: "POST",
    body: JSON.stringify({ frontend_origin }),
    revalidate: false,
  });
}

type ReviewResponse = {
  review: CourseReview | null;
  pending_approval?: boolean;
  detail?: string;
};

export async function fetchMyCourseReview(
  token: string,
  slug: string,
): Promise<CourseReview | null> {
  const data = await apiFetchAuth<ReviewResponse>(endpoints.courseMyReview(slug), token);
  return data.review;
}

export async function submitCourseReview(
  token: string,
  slug: string,
  payload: { rating: number; text: string },
): Promise<ReviewResponse> {
  return apiFetchAuth<ReviewResponse>(endpoints.courseReview(slug), token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
