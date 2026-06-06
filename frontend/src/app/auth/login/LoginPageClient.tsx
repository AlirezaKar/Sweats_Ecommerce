"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return routes.profile;
  }
  return value;
}

export default function LoginPageClient() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(nextPath);
  }, [user, router, nextPath]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await login(trimmedUsername, password);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">{fa.nav.login}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {fa.auth.loginSubtitle} {fa.auth.demoHint}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="login-username" className="text-sm font-medium">
            {fa.auth.username}
          </label>
          <input
            id="login-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-2"
            autoComplete="username"
            disabled={busy}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-sm font-medium">
            {fa.auth.password}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-2"
            autoComplete="current-password"
            disabled={busy}
          />
        </div>

        {error ? <p className="text-sm text-sale">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
        >
          {busy ? fa.common.loading : fa.nav.login}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground">{fa.auth.noAccount}</p>
        <Link
          href={routes.register}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-primary py-3 text-sm font-medium text-primary hover:bg-primary/5"
        >
          {fa.nav.register}
        </Link>
      </div>
    </div>
  );
}
