"use client";

import { CommentSection } from "@/components/comments/CommentSection";
import { endpoints } from "@/lib/constants/endpoints";
import { fa } from "@/lib/i18n/fa";
import type { ThreadComment } from "@/types/api";

type Props = {
  slug: string;
  comments: ThreadComment[];
};

export function BlogComments({ slug, comments }: Props) {
  return (
    <CommentSection
      comments={comments}
      submitEndpoint={endpoints.blogComments(slug)}
      title={fa.blog.comments}
    />
  );
}
