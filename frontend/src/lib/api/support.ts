import type { SupportMessage, SupportThread } from "@/types/api";
import { apiFetch, apiFetchAuth } from "@/lib/api/client";

export async function fetchSupportThread(token: string): Promise<SupportThread> {
  return apiFetchAuth<SupportThread>("/api/support/thread/", token);
}

export async function sendSupportMessage(token: string, body: string): Promise<SupportMessage> {
  const data = await apiFetchAuth<{ message: SupportMessage }>("/api/support/messages/", token, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return data.message;
}

export type ContactFormPayload = {
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
};

export async function submitContactForm(payload: ContactFormPayload): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>("/api/contact/", undefined, {
    method: "POST",
    body: JSON.stringify(payload),
    revalidate: false,
  });
}
