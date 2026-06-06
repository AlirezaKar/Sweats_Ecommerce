"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(routes.profile);
  }, [user, router]);

  if (user) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");

    if (password !== passwordConfirm) {
      setError(fa.auth.passwordMismatch);
      return;
    }

    setBusy(true);
    try {
      await register({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      router.replace(routes.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">{fa.nav.register}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{fa.auth.registerSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium">{fa.auth.username}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-2"
            autoComplete="username"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">{fa.auth.firstName}</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2"
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{fa.auth.lastName}</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2"
              autoComplete="family-name"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">{fa.auth.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-2"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{fa.auth.passwordConfirm}</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-4 py-2"
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="text-sm text-sale">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-primary py-3 text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
        >
          {fa.nav.register}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground">{fa.auth.hasAccount}</p>
        <Link
          href={routes.login}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-border py-3 text-sm font-medium hover:bg-muted/50"
        >
          {fa.nav.login}
        </Link>
      </div>
    </div>
  );
}
