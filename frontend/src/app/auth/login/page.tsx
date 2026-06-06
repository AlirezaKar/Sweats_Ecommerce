import type { Metadata } from "next";
import { Suspense } from "react";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { privatePageMetadata } from "@/lib/seo/metadata";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = privatePageMetadata(
  fa.nav.login,
  fa.auth.loginSubtitle,
  routes.login,
);

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <LoginPageClient />
    </Suspense>
  );
}
