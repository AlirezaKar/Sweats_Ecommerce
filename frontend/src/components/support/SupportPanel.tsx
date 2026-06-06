"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchSupportThread, sendSupportMessage } from "@/lib/api/support";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import type { SupportMessage } from "@/types/api";

type Props = { onClose: () => void };

export function SupportPanel({ onClose }: Props) {
  const { user, token, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoadingThread(true);
    setError("");
    try {
      const thread = await fetchSupportThread(token);
      setMessages(thread.messages ?? []);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadThread();
  }, [token, loadThread]);

  useEffect(() => {
    if (!token || !user) return;
    const id = window.setInterval(() => {
      void loadThread(true);
    }, 20_000);
    return () => window.clearInterval(id);
  }, [token, user, loadThread]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loadingThread]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !token || busy) return;

    setBusy(true);
    setError("");
    try {
      const message = await sendSupportMessage(token, body);
      setMessages((prev) => [...prev, message]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-50 flex h-[min(36rem,78dvh)] min-h-[24rem] max-h-[min(40rem,90dvh)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:inset-x-auto sm:end-[calc(1rem+env(safe-area-inset-right,0px))] sm:w-[min(22rem,calc(100vw-2rem))] lg:bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      role="dialog"
      aria-label={fa.support.title}
    >
      <div className="flex items-center gap-3 bg-[#4a9fd4] px-4 py-5 text-white">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
          👤
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-base font-semibold leading-7 sm:text-lg">{fa.support.title}</p>
          <p className="mt-0.5 text-sm leading-5 opacity-90">{fa.support.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="touch-target rounded-full p-1 hover:bg-white/20"
          aria-label={fa.common.close}
        >
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-muted/50 p-4">
        {authLoading || loadingThread ? (
          <p className="text-center text-sm text-muted-foreground">{fa.common.loading}</p>
        ) : !user || !token ? (
          <div className="space-y-3 text-center text-sm">
            <p className="text-muted-foreground">{fa.support.loginRequired}</p>
            <Link
              href={routes.login}
              className="inline-block rounded-lg bg-[#4a9fd4] px-4 py-2 text-white hover:bg-[#3d8fc4]"
            >
              {fa.nav.login}
            </Link>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end space-y-3">
            {messages.length === 0 ? (
              <div className="max-w-[85%] rounded-2xl rounded-ee-sm bg-background px-4 py-3 text-sm shadow-sm">
                {fa.support.greeting}
              </div>
            ) : null}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.is_staff
                    ? "rounded-es-sm bg-background"
                    : "ms-auto rounded-ee-sm bg-[#4a9fd4] text-white"
                }`}
              >
                {msg.is_staff ? (
                  <p className="mb-1 text-[10px] font-medium text-[#4a9fd4]">{msg.author_name}</p>
                ) : null}
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
        {error ? <p className="mt-3 text-center text-xs text-destructive">{error}</p> : null}
      </div>

      {user && token ? (
        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={fa.support.placeholder}
            disabled={busy}
            className="min-w-0 flex-1 rounded-full border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a9fd4]/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="touch-target shrink-0 rounded-full bg-[#4a9fd4] px-4 py-2 text-sm text-white hover:bg-[#3d8fc4] disabled:opacity-50"
          >
            {fa.support.send}
          </button>
        </form>
      ) : null}
    </div>
  );
}
