"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createComment } from "@/lib/api/comments";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatBlogDateFull } from "@/lib/utils/formatBlogDate";
import type { ThreadComment } from "@/types/api";

type Props = {
  comments: ThreadComment[];
  submitEndpoint: string;
  showRating?: boolean;
  title?: string;
  pendingHint?: string;
};

function countComments(items: ThreadComment[]): number {
  return items.reduce((sum, item) => sum + 1 + countComments(item.replies ?? []), 0);
}

export function CommentSection({
  comments,
  submitEndpoint,
  showRating = false,
  title = fa.comments.title,
  pendingHint = fa.comments.pendingApproval,
}: Props) {
  const total = useMemo(() => countComments(comments), [comments]);

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="mb-6 text-xl font-bold">
        {title} ({total})
      </h2>

      <CommentForm
        submitEndpoint={submitEndpoint}
        showRating={showRating}
        pendingHint={pendingHint}
      />

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{fa.comments.noComments}</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              submitEndpoint={submitEndpoint}
              showRating={showRating}
              pendingHint={pendingHint}
              depth={0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  submitEndpoint,
  showRating,
  pendingHint,
  depth,
}: {
  comment: ThreadComment;
  submitEndpoint: string;
  showRating: boolean;
  pendingHint: string;
  depth: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <li
      className={`rounded-xl border border-border bg-muted/30 p-4 sm:p-5 ${
        depth > 0 ? "ms-4 border-s-2 border-s-primary/30 sm:ms-8" : ""
      }`}
    >
      <CommentHeader comment={comment} showRating={showRating} />
      <p className="mt-3 text-sm leading-7 text-foreground/90">{comment.text}</p>

      <button
        type="button"
        onClick={() => setReplyOpen((v) => !v)}
        className="mt-3 text-sm text-primary hover:underline"
      >
        {fa.comments.reply}
      </button>

      {replyOpen && (
        <div className="mt-4 border-t border-border pt-4">
          <CommentForm
            submitEndpoint={submitEndpoint}
            parentId={comment.id}
            placeholder={fa.comments.writeReply}
            pendingHint={pendingHint}
            onSuccess={() => setReplyOpen(false)}
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <ul className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              submitEndpoint={submitEndpoint}
              showRating={showRating}
              pendingHint={pendingHint}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function CommentHeader({
  comment,
  showRating,
}: {
  comment: ThreadComment;
  showRating: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{comment.user_name}</span>
      {comment.is_staff && (
        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">
          {fa.comments.staffBadge}
        </span>
      )}
      {showRating && comment.rating != null && (
        <span className="flex gap-0.5" aria-label={`${comment.rating} از ۵`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <span
              key={value}
              className={`text-sm ${value <= comment.rating! ? "text-amber-400" : "text-muted-foreground/40"}`}
              aria-hidden
            >
              ★
            </span>
          ))}
        </span>
      )}
      {showRating && comment.is_verified_buyer && (
        <span className="rounded bg-accent/15 px-2 py-0.5 text-xs text-accent">
          {fa.comments.verifiedBuyer}
        </span>
      )}
      <time className="ms-auto text-xs text-muted-foreground" dateTime={comment.created_at}>
        {formatBlogDateFull(comment.created_at)}
      </time>
    </div>
  );
}

function CommentForm({
  submitEndpoint,
  parentId,
  showRating = false,
  placeholder = fa.comments.writeComment,
  pendingHint = fa.comments.pendingApproval,
  onSuccess,
}: {
  submitEndpoint: string;
  parentId?: number;
  showRating?: boolean;
  placeholder?: string;
  pendingHint?: string;
  onSuccess?: () => void;
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!user || !token) {
    return (
      <p className="text-sm text-muted-foreground">
        {fa.comments.loginToComment}{" "}
        <Link href={routes.login} className="text-primary hover:underline">
          {fa.header.loginRegister}
        </Link>
      </p>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !token) return;

    setBusy(true);
    setMessage("");
    try {
      await createComment(submitEndpoint, token, {
        text: text.trim(),
        parent_id: parentId,
        rating: showRating && !parentId ? rating : undefined,
      });
      setText("");
      setMessage(fa.comments.submitSuccess);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showRating && !parentId && (
        <div>
          <p className="mb-1.5 text-sm font-medium">{fa.comments.rating}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`text-2xl transition ${
                  value <= rating ? "text-amber-400" : "text-muted-foreground/40"
                }`}
                aria-label={`${value} از ۵`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
        >
          {parentId ? fa.comments.reply : fa.comments.send}
        </button>
        <span className="text-xs text-muted-foreground">{pendingHint}</span>
        {message && (
          <span className={`text-sm ${message === fa.comments.submitSuccess ? "text-accent" : "text-sale"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
