"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useAuth } from "@/context/AuthContext";
import { enrollCourse, submitCourseReview } from "@/lib/api/courses";
import { getContinueEpisodeSlug } from "@/lib/courseProgress";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { CourseListItem, CourseReview } from "@/types/api";

type Props = {
  course: CourseListItem;
  progressPercent: number;
  isOwned: boolean;
  viewTab: "all" | "mine";
  review: CourseReview | null;
  onReviewSubmitted: (review: CourseReview) => void;
  onEnrolled: (slug: string) => void;
};

export function DashboardCourseCard({
  course,
  progressPercent,
  isOwned,
  viewTab,
  review,
  onReviewSubmitted,
  onEnrolled,
}: Props) {
  const router = useRouter();
  const { token } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const continueSlug = getContinueEpisodeSlug(course.slug, course.first_episode_slug);
  const watchHref =
    continueSlug != null
      ? routes.courseWatch(course.slug, continueSlug)
      : routes.course(course.slug);
  const completed = progressPercent >= 100;

  async function handleEnroll() {
    if (!token) {
      router.push(routes.login);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await enrollCourse(token, course.slug);
      if (result.payment_url) {
        window.location.assign(result.payment_url);
        return;
      }
      if (result.enrolled) {
        onEnrolled(course.slug);
        setNotice(result.detail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleReviewSubmit() {
    if (!token) {
      router.push(routes.login);
      return;
    }
    if (review) return;
    if (text.trim().length < 3) {
      setError(fa.comments.writeComment);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await submitCourseReview(token, course.slug, {
        rating,
        text: text.trim(),
      });
      if (result.review) {
        onReviewSubmitted(result.review);
        setNotice(result.detail ?? fa.courses.dashboard.reviewSubmitted);
        setReviewOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <article className="rounded-xl border border-border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={routes.course(course.slug)}
              className="line-clamp-2 text-base font-bold leading-7 hover:text-primary"
            >
              {course.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{course.instructor_name}</p>
          </div>
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[4.5rem] sm:w-28">
            {course.thumbnail ? (
              <MediaImage
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl opacity-30">▶</div>
            )}
          </div>
        </div>

        {isOwned ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{fa.courses.dashboard.progress}</span>
              <span dir="ltr">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  completed ? "bg-accent" : "bg-[#2a9d8f]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {course.is_free
              ? fa.courses.dashboard.addHintFree
              : fa.courses.dashboard.addHintPaid(formatPrice(course.price ?? 0))}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isOwned ? (
            <>
              <Link
                href={watchHref}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2a9d8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#238b7f]"
              >
                <PlayIcon />
                {progressPercent > 0 && !completed
                  ? fa.courses.dashboard.continueCourse
                  : completed
                    ? fa.courses.dashboard.rewatch
                    : fa.courses.startLearning}
              </Link>

              {review ? (
                <span className="text-sm text-muted-foreground">
                  {fa.courses.dashboard.reviewDone} · {review.rating}/5
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {fa.courses.dashboard.submitReview}
                </button>
              )}

              <span className="ms-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                {fa.courses.dashboard.inYourLibrary}
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleEnroll}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
              >
                {busy
                  ? fa.common.loading
                  : course.is_free
                    ? fa.courses.dashboard.addToMyCourses
                    : fa.courses.dashboard.buyCourse}
              </button>
              {!course.is_free && course.price != null ? (
                <span className="text-sm font-semibold text-primary">{formatPrice(course.price)}</span>
              ) : null}
              {viewTab === "all" ? (
                <span className="ms-auto text-xs text-muted-foreground">{fa.courses.dashboard.catalogItem}</span>
              ) : null}
            </>
          )}
        </div>

        {error ? <p className="mt-3 text-xs text-sale">{error}</p> : null}
        {notice ? <p className="mt-3 text-xs text-accent">{notice}</p> : null}
      </article>

      {reviewOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{fa.courses.dashboard.reviewTitle}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{course.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg p-1 hover:bg-muted"
                aria-label={fa.common.close}
              >
                ✕
              </button>
            </div>

            <p className="mb-2 text-sm font-medium">{fa.comments.rating}</p>
            <div className="mb-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`text-2xl ${value <= rating ? "text-amber-400" : "text-muted-foreground/40"}`}
                  aria-label={`${value}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={fa.comments.writeComment}
              className="w-full resize-y rounded-lg border border-border px-3 py-2 text-sm"
            />

            {error ? <p className="mt-2 text-sm text-sale">{error}</p> : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleReviewSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? fa.common.loading : fa.comments.send}
              </button>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                {fa.common.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
