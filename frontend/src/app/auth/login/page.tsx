import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <LoginPageClient />
    </Suspense>
  );
}
