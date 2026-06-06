import { apiFetchAuth } from "@/lib/api/client";
import type { ThreadComment } from "@/types/api";

type CreateCommentPayload = {
  text: string;
  parent_id?: number;
  rating?: number;
};

type CreateCommentResponse = {
  comment: ThreadComment;
  pending_approval: boolean;
  detail: string;
};

export async function createComment(
  endpoint: string,
  token: string,
  payload: CreateCommentPayload,
): Promise<CreateCommentResponse> {
  return apiFetchAuth<CreateCommentResponse>(endpoint, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
