import type { Metadata } from "next";
import { Suspense } from "react";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { fetchCourses } from "@/lib/api/courses";
import { buildPageMetadata } from "@/lib/seo/metadata";
import CoursesPageClient from "./CoursesPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: fa.nav.courses,
  description:
    "دوره‌های آموزشی شیرینی‌پزی و کیک‌پزی آنلاین — یادگیری گام‌به‌گام با مدرس‌های باتجربه در شیرینی‌خانه.",
  path: routes.courses,
});

export default async function CoursesPage() {
  const courses = await fetchCourses(48).catch(() => []);

  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <CoursesPageClient initialCourses={courses} />
    </Suspense>
  );
}
