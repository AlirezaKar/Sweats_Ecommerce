"use client";

import { CommentSection } from "@/components/comments/CommentSection";
import { endpoints } from "@/lib/constants/endpoints";
import type { ThreadComment } from "@/types/api";

type Props = {
  slug: string;
  comments: ThreadComment[];
};

export function ProductComments({ slug, comments }: Props) {
  return (
    <CommentSection
      comments={comments}
      submitEndpoint={endpoints.productComments(slug)}
      showRating
    />
  );
}
