"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { contactDetails, contactFormSubjects, contactIntro } from "@/content/contact";
import { submitContactForm } from "@/lib/api/support";
import { fa } from "@/lib/i18n/fa";

export default function ContactPageClient() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    setBusy(true);
    setSent(false);
    setError("");
    try {
      await submitContactForm({ name, email, phone, subject, message });
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{fa.contact.title}</h1>
        <p className="mt-3 text-muted-foreground">{fa.contact.subtitle}</p>
      </div>

      <p className="mb-10 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm leading-7 text-muted-foreground">
        {contactIntro}
      </p>

      <div className="grid gap-10 lg:grid-cols-5">
        <aside className="space-y-6 lg:col-span-2">
          <ContactCard label={fa.contact.phone}>
            <a
              href={`tel:${contactDetails.phoneHref}`}
              dir="ltr"
              className="font-medium text-accent hover:underline"
            >
              {contactDetails.phone}
            </a>
          </ContactCard>

          <ContactCard label={fa.contact.email}>
            <a
              href={`mailto:${contactDetails.email}`}
              dir="ltr"
              className="font-medium text-accent hover:underline"
            >
              {contactDetails.email}
            </a>
          </ContactCard>

          <ContactCard label={fa.contact.address}>
            <p className="leading-7 text-muted-foreground">{contactDetails.address}</p>
          </ContactCard>

          <ContactCard label={fa.contact.hours}>
            <p className="leading-7 text-muted-foreground">{contactDetails.hours}</p>
          </ContactCard>

          <ContactCard label={fa.contact.responseTime}>
            <p className="leading-7 text-muted-foreground">{contactDetails.responseTime}</p>
          </ContactCard>

          <p className="text-xs text-muted-foreground">{fa.contact.widgetHint}</p>
        </aside>

        <section className="rounded-xl border border-border bg-background p-6 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-bold">{fa.contact.formTitle}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{fa.contact.formHint}</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <Field label={fa.contact.name}>
              <input
                name="name"
                required
                placeholder={fa.contact.namePlaceholder}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={fa.contact.emailLabel}>
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder={fa.contact.emailPlaceholder}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                />
              </Field>
              <Field label={fa.contact.phoneLabel}>
                <input
                  name="phone"
                  type="tel"
                  dir="ltr"
                  placeholder={contactDetails.phone}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                />
              </Field>
            </div>

            <Field label={fa.contact.subject}>
              <select
                name="subject"
                required
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
              >
                <option value="" disabled>
                  —
                </option>
                {contactFormSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={fa.contact.message}>
              <textarea
                name="message"
                required
                rows={5}
                placeholder={fa.contact.messagePlaceholder}
                className="w-full resize-y rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
              />
            </Field>

            {sent ? (
              <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
                {fa.contact.success}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {fa.contact.send}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ContactCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
