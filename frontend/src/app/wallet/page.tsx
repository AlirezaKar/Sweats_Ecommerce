import { Suspense } from "react";
import WalletPageClient from "./WalletPageClient";

export default function WalletPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">در حال بارگذاری…</p>}>
      <WalletPageClient />
    </Suspense>
  );
}
