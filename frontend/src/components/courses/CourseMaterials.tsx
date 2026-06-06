"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchCourseFiles } from "@/lib/api/courses";
import { fa } from "@/lib/i18n/fa";
import type { CourseFile } from "@/types/api";

type Props = {
  courseSlug: string;
};

export function CourseMaterials({ courseSlug }: Props) {
  const { token, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setStatus("idle");
      setMessage(fa.courses.loginForMaterials);
      setFiles([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setMessage("");

    fetchCourseFiles(token, courseSlug)
      .then((data) => {
        if (cancelled) return;
        setFiles(data);
        setStatus("ready");
        setMessage(data.length === 0 ? fa.courses.noMaterials : "");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const apiErr = err as { status?: number };
        if (apiErr.status === 403) {
          setStatus("idle");
          setMessage(fa.courses.enrollForMaterials);
        } else {
          setStatus("error");
          setMessage(fa.common.error);
        }
        setFiles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, courseSlug]);

  return (
    <section className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
      <h2 className="text-lg font-bold">{fa.courses.materials}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{fa.courses.materialsHint}</p>

      {status === "loading" && (
        <p className="mt-4 text-sm text-muted-foreground">{fa.common.loading}</p>
      )}

      {message && status !== "loading" && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={file.url ?? "#"}
                download={file.filename || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{file.title}</span>
                <span className="shrink-0 text-xs text-primary">{fa.courses.downloadFile}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
