"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardCourseCard } from "@/components/courses/DashboardCourseCard";
import { useAuth } from "@/context/AuthContext";
import { fetchCourses, fetchMyCourseReview } from "@/lib/api/courses";
import { getCourseProgressPercent } from "@/lib/courseProgress";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { CourseListItem, CourseReview } from "@/types/api";

type Tab = "mine" | "all";
type StatusFilter = "all" | "in_progress" | "completed" | "not_started";
type AccessFilter = "all" | "free" | "paid";
type SortOrder = "newest" | "alpha" | "progress";

type Props = {
  initialCourses: CourseListItem[];
};

export default function CoursesPageClient({ initialCourses }: Props) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const paymentHandled = useRef(false);
  const [tab, setTab] = useState<Tab>("all");
  const [courses, setCourses] = useState<CourseListItem[]>(
    initialCourses.map((c) => ({ ...c, is_enrolled: c.is_enrolled ?? false })),
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [access, setAccess] = useState<AccessFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [progressTick, setProgressTick] = useState(0);
  const [reviews, setReviews] = useState<Record<string, CourseReview | null>>({});
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paymentNoticeTone, setPaymentNoticeTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    fetchCourses(48, token)
      .then((data) => setCourses(data.map((c) => ({ ...c, is_enrolled: c.is_enrolled ?? false }))))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment || paymentHandled.current) return;

    paymentHandled.current = true;
    const courseSlug = searchParams.get("course");
    const ref = searchParams.get("ref");
    window.history.replaceState(null, "", routes.courses);

    if (payment === "success") {
      setPaymentNoticeTone("success");
      setPaymentNotice(
        ref
          ? fa.courses.dashboard.paymentSuccessRef(ref)
          : fa.courses.dashboard.paymentSuccess,
      );
      if (courseSlug) {
        setCourses((prev) =>
          prev.map((course) =>
            course.slug === courseSlug ? { ...course, is_enrolled: true } : course,
          ),
        );
        setTab("mine");
      }
      if (token) {
        fetchCourses(48, token)
          .then((data) =>
            setCourses(data.map((c) => ({ ...c, is_enrolled: c.is_enrolled ?? false }))),
          )
          .catch(() => {});
      }
    } else if (payment === "canceled") {
      setPaymentNoticeTone("info");
      setPaymentNotice(fa.courses.dashboard.paymentCanceled);
    } else if (payment === "failed") {
      setPaymentNoticeTone("error");
      setPaymentNotice(fa.courses.dashboard.paymentFailed);
    } else {
      setPaymentNoticeTone("error");
      setPaymentNotice(fa.courses.dashboard.paymentInvalid);
    }
  }, [searchParams, token]);

  useEffect(() => {
    function onProgressUpdate() {
      setProgressTick((n) => n + 1);
    }
    window.addEventListener("course-progress-updated", onProgressUpdate);
    return () => window.removeEventListener("course-progress-updated", onProgressUpdate);
  }, []);

  useEffect(() => {
    if (!token) {
      setReviews({});
      return;
    }
    let cancelled = false;
    Promise.all(
      courses.map(async (course) => {
        try {
          const review = await fetchMyCourseReview(token, course.slug);
          return [course.slug, review] as const;
        } catch {
          return [course.slug, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setReviews(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [token, courses]);

  const getProgress = useCallback(
    (course: CourseListItem) => getCourseProgressPercent(course.slug, course.episode_count),
    [progressTick],
  );

  const filtered = useMemo(() => {
    let list = tab === "mine" ? courses.filter((course) => course.is_enrolled) : [...courses];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (course) =>
          course.title.toLowerCase().includes(q) ||
          course.instructor_name.toLowerCase().includes(q),
      );
    }

    if (access === "free") list = list.filter((c) => c.is_free);
    if (access === "paid") list = list.filter((c) => !c.is_free);

    list = list.filter((course) => {
      const p = getProgress(course);
      const owned = course.is_enrolled;
      if (status === "in_progress") return owned && p > 0 && p < 100;
      if (status === "completed") return owned && p >= 100;
      if (status === "not_started") return tab === "mine" ? p === 0 : !owned || p === 0;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "alpha") return a.title.localeCompare(b.title, "fa");
      if (sort === "progress") return getProgress(b) - getProgress(a);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [courses, tab, query, status, access, sort, getProgress]);

  function handleReviewSubmitted(slug: string, review: CourseReview) {
    setReviews((prev) => ({ ...prev, [slug]: review }));
  }

  function handleEnrolled(slug: string) {
    setCourses((prev) =>
      prev.map((course) =>
        course.slug === slug ? { ...course, is_enrolled: true } : course,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.courses.dashboard.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{fa.courses.dashboard.subtitle}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          {fa.courses.dashboard.myCourses}
        </TabButton>
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          {fa.courses.dashboard.allCourses}
        </TabButton>
      </div>

      {paymentNotice ? (
        <p
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            paymentNoticeTone === "success"
              ? "bg-accent/10 text-accent"
              : paymentNoticeTone === "error"
                ? "text-sale"
                : "text-muted-foreground"
          }`}
        >
          {paymentNotice}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label={fa.courses.dashboard.search}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fa.courses.dashboard.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </FilterField>
        <FilterField label={fa.courses.dashboard.statusFilter}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{fa.courses.dashboard.statusAll}</option>
            <option value="in_progress">{fa.courses.dashboard.statusInProgress}</option>
            <option value="completed">{fa.courses.dashboard.statusCompleted}</option>
            <option value="not_started">{fa.courses.dashboard.statusNotStarted}</option>
          </select>
        </FilterField>
        <FilterField label={fa.courses.dashboard.accessFilter}>
          <select
            value={access}
            onChange={(e) => setAccess(e.target.value as AccessFilter)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{fa.courses.dashboard.accessAll}</option>
            <option value="free">{fa.courses.free}</option>
            <option value="paid">{fa.courses.dashboard.accessPaid}</option>
          </select>
        </FilterField>
        <FilterField label={fa.courses.dashboard.sortFilter}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">{fa.courses.dashboard.sortNewest}</option>
            <option value="alpha">{fa.courses.dashboard.sortAlpha}</option>
            <option value="progress">{fa.courses.dashboard.sortProgress}</option>
          </select>
        </FilterField>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-muted-foreground">
            {tab === "mine" ? fa.courses.dashboard.emptyMine : fa.courses.comingSoon}
          </p>
          {tab === "mine" ? (
            <button
              type="button"
              onClick={() => setTab("all")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              {fa.courses.dashboard.browseAll}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((course) => (
            <DashboardCourseCard
              key={`${tab}-${course.id}`}
              course={course}
              progressPercent={getProgress(course)}
              isOwned={course.is_enrolled}
              viewTab={tab}
              review={reviews[course.slug] ?? null}
              onReviewSubmitted={(review) => handleReviewSubmitted(course.slug, review)}
              onEnrolled={handleEnrolled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "border border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
