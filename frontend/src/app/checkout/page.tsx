import { Suspense } from "react";
import CheckoutPageClient from "./CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">در حال بارگذاری…</p>}>
      <CheckoutPageClient />
    </Suspense>
  );
}
