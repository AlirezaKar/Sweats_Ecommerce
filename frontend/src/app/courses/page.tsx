import { Suspense } from "react";
import { fetchCourses } from "@/lib/api/courses";
import CoursesPageClient from "./CoursesPageClient";

export default async function CoursesPage() {
  const courses = await fetchCourses(48).catch(() => []);

  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <CoursesPageClient initialCourses={courses} />
    </Suspense>
  );
}
