import type { Metadata, Viewport } from "next";
import { DIRECTION, LANG } from "@/lib/constants/locale";
import { vazirmatn } from "@/lib/fonts";
import { fetchCategories } from "@/lib/api/products";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileCategoryBar } from "@/components/layout/MobileCategoryBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { SupportWidget } from "@/components/support/SupportWidget";
import { JsonLd } from "@/lib/seo/JsonLd";
import { rootMetadata } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/schemas";
import "./globals.css";

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  try {
    categories = await fetchCategories();
  } catch {
    /* API may be offline during first setup */
  }

  return (
    <html lang={LANG} dir={DIRECTION} className={`${vazirmatn.variable} h-full antialiased`}>
      <body className={`${vazirmatn.className} flex min-h-full flex-col font-sans`}>
        <JsonLd data={organizationSchema()} />
        <AuthProvider>
          <CartProvider>
            <SiteHeader categories={categories} />
            <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
              {children}
            </main>
            <MobileCategoryBar categories={categories} />
            <SiteFooter />
            <ScrollToTop />
            <SupportWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
