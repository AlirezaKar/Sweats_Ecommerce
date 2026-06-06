# SEO checklist

A practical checklist for improving search engine visibility. Use it before launch and again after major changes (new pages, redesign, domain move).

**How to use this doc**

1. Audit the live site (or staging) with the tools listed at the end.
2. Work through each section; check items only when they are verified in production.
3. Fix **Critical** items first — they block indexing or cause major ranking penalties.
4. Track scores over time; SEO is iterative, not a one-time task.

---

## Quick priority for this project

The Sweats storefront is a **Next.js App Router** site (`frontend/src/app/`) with Persian (`fa`) RTL content. Current gaps to address first:

| Priority | Item | Status in repo |
|----------|------|----------------|
| Critical | Unique `title` + `description` per public page | Implemented (`generateMetadata` / `metadata` on all public routes) |
| Critical | `sitemap.xml` listing products, blog, courses | Implemented (`frontend/src/app/sitemap.ts`) |
| Critical | `robots.txt` (allow public, block account/checkout) | Implemented (`frontend/src/app/robots.ts`) |
| Critical | Canonical URLs on all indexable pages | Implemented via `buildPageMetadata()` |
| High | Open Graph + Twitter Card meta tags | Implemented |
| High | Structured data (Product, Article, BreadcrumbList, FAQ, Video) | Implemented (`frontend/src/lib/seo/schemas.ts`) |
| High | Server-rendered HTML for product/blog/course detail | SSR pages with metadata + JSON-LD |
| High | `noindex` on cart, checkout, profile, auth | Implemented (route `layout.tsx` files) |
| Medium | Image `alt` text on product/media components | Product detail uses API `alt_text` when available |
| Medium | Core Web Vitals (LCP, INP, CLS) | Measure in production after deploy |

---

## 1. Crawlability and indexation

Search engines must be able to discover, fetch, and index your pages.

### Critical

- [ ] **Site is publicly reachable** — no login wall on product, blog, or category pages.
- [ ] **HTTPS everywhere** — valid SSL certificate; HTTP redirects to HTTPS.
- [ ] **`robots.txt`** exists at `/robots.txt` and references the sitemap URL.
- [ ] **`sitemap.xml`** (or sitemap index) submitted in Google Search Console and Bing Webmaster Tools.
- [ ] **Important URLs return HTTP 200** — not 404, 500, or soft-404 (empty page with 200).
- [ ] **No accidental `noindex`** on pages you want ranked (`<meta name="robots" content="noindex">` or `X-Robots-Tag`).
- [ ] **Canonical tags** on every indexable page point to the preferred URL (no duplicate content from query params or trailing slashes).

### Recommended

- [ ] **Private/account pages use `noindex`** — cart, checkout, login, register, profile, orders, wallet.
- [ ] **Pagination handled correctly** — `rel="next"` / `rel="prev"` or canonical to page 1 where appropriate.
- [ ] **404 page** is helpful (links home, search, categories) and returns true 404 status.
- [ ] **No orphan pages** — every public page is linked from nav, footer, or internal content.
- [ ] **Crawl budget** — avoid infinite faceted URLs (`?sort=`, `?filter=` combinations) without canonical control.

### For Next.js (this project)

- [ ] Add `frontend/src/app/robots.ts` (or `public/robots.txt`).
- [ ] Add `frontend/src/app/sitemap.ts` — dynamically include `/products/[slug]`, `/blog/[slug]`, `/courses/[slug]`, static pages.
- [ ] Use `export const metadata` or `generateMetadata()` on each route under `frontend/src/app/`.
- [ ] Set `robots: { index: false }` in metadata for non-public routes.

---

## 2. URL structure

- [ ] **Readable, stable URLs** — `/products/chocolate-cake` not `/products?id=42`.
- [ ] **Lowercase, hyphen-separated** slugs (consistent with backend slugs).
- [ ] **One URL per resource** — redirects (301) from old URLs after slug changes.
- [ ] **No duplicate paths** — e.g. `/products/` and `/products` resolve to one canonical form.
- [ ] **Trailing slash policy** — pick one style; redirect the other (Next.js `trailingSlash` config).

---

## 3. On-page SEO (per page)

Every indexable page needs unique, accurate signals.

### Title and description

- [ ] **Unique `<title>`** per page (50–60 characters ideal; brand suffix optional).
- [ ] **Unique meta description** per page (120–160 characters; compelling, not keyword-stuffed).
- [ ] **One H1 per page** — matches page intent (product name on product page, post title on blog).
- [ ] **Logical heading hierarchy** — H1 → H2 → H3 without skipping levels.

### Content

- [ ] **Primary keyword/intent** reflected in title, H1, first paragraph, and URL where natural.
- [ ] **Sufficient unique copy** — thin pages (only a title and price) rank poorly; add descriptions, FAQs, usage tips.
- [ ] **Internal links** — related products, categories, blog posts linked from detail pages.
- [ ] **Breadcrumbs** visible and marked up (you already have breadcrumb UI on product pages — add schema).
- [ ] **Fresh content** — blog and seasonal updates signal an active site.

### Images and media

- [ ] **`alt` attributes** on all meaningful images (product photos, blog hero images).
- [ ] **Descriptive file names** where possible (`chocolate-cake.webp` not `IMG_001.webp`).
- [ ] **Compressed images** — WebP/AVIF; reasonable dimensions (backend already converts to WebP).
- [ ] **Lazy loading** below the fold; **priority** for LCP hero image.

### For this storefront

| Page type | Title pattern (example) | Meta description focus |
|-----------|-------------------------|-------------------------|
| Home | `شیرینی‌خانه \| فروشگاه آنلاین شیرینی و کیک` | Brand + main categories + delivery area |
| Product | `{product.title} \| شیرینی‌خانه` | Price, key ingredients, availability |
| Category / listing | `{category} \| فروشگاه شیرینی‌خانه` | What you sell in that category |
| Blog post | `{post.title} \| وبلاگ شیرینی‌خانه` | Summary of article |
| Course | `{course.title} \| دوره آموزشی` | What the learner gains |
| About / Contact / FAQ | Page name + brand | Trust, location, support |

---

## 4. Technical SEO

### HTML and rendering

- [ ] **Critical content in initial HTML** — crawlers see product title, price, description without requiring heavy JS execution.
- [ ] **`lang="fa"` and `dir="rtl"`** on `<html>` (already set in `layout.tsx`).
- [ ] **Valid semantic HTML** — `<main>`, `<nav>`, `<article>`, `<header>`, `<footer>`.
- [ ] **No hidden text** or cloaking (CSS-only keyword dumps).

### Meta and social

- [ ] **`metadataBase`** in root layout — absolute URLs for OG images and canonicals.
- [ ] **Open Graph** — `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale` (`fa_IR`).
- [ ] **Twitter Card** — `summary_large_image` with title, description, image.
- [ ] **Favicon** — ICO/PNG/SVG; apple-touch-icon for mobile bookmarks.

### Structured data (JSON-LD)

Validate with [Google Rich Results Test](https://search.google.com/test/rich-results).

- [ ] **Organization** or **LocalBusiness** on home/about (name, logo, URL, contact).
- [ ] **Product** on product pages — name, image, description, offers (price, availability, currency IRR).
- [ ] **Article** or **BlogPosting** on blog posts — headline, datePublished, author, image.
- [ ] **Course** on course pages — name, description, provider.
- [ ] **BreadcrumbList** on detail pages.
- [ ] **FAQPage** on FAQ page if using FAQ schema (content must match visible FAQ).

### Performance (ranking factor)

- [ ] **LCP** (Largest Contentful Paint) &lt; 2.5s on mobile.
- [ ] **INP** (Interaction to Next Paint) &lt; 200ms.
- [ ] **CLS** (Cumulative Layout Shift) &lt; 0.1.
- [ ] **TTFB** reasonable on server-rendered pages (&lt; 800ms ideal).
- [ ] **Font loading** optimized — `next/font` (Vazirmatn) with `display: swap` (verify).
- [ ] **JS bundle size** — avoid shipping large client bundles on content-heavy pages.

### Mobile

- [ ] **Responsive layout** — readable text without horizontal scroll.
- [ ] **Tap targets** ≥ 48×48px for buttons and links.
- [ ] **Viewport meta** configured (already in `layout.tsx`).
- [ ] **Mobile-friendly test** passes in Search Console.

---

## 5. E-commerce specific

- [ ] **Product pages indexable** — out-of-stock products can stay indexed with `OutOfStock` availability in schema.
- [ ] **Clear price** visible in HTML (not only after client hydration).
- [ ] **Stock status** honest in content and structured data.
- [ ] **Category pages** target category keywords; unique intro text per category.
- [ ] **Reviews/ratings** — if shown, add `aggregateRating` in Product schema (only with real reviews).
- [ ] **Checkout/cart not indexed** — `noindex, nofollow` on `/cart`, `/checkout`, payment return URLs.

---

## 6. International and local (Persian / Iran)

- [ ] **`lang="fa"`** sitewide; no mixed-language pages without `hreflang`.
- [ ] **`hreflang`** only if you add other languages later (e.g. `fa-IR`, `en`).
- [ ] **Persian typography** — proper RTL, readable line length, correct numerals if mixed.
- [ ] **Local signals** — address, phone, business hours on contact/about (helps local trust).
- [ ] **Iran payment/shipping** mentioned where relevant (builds relevance for local queries).

---

## 7. Trust, security, and UX signals

- [ ] **Contact page** with real business info.
- [ ] **About page** — brand story, credentials.
- [ ] **Privacy policy** and terms (especially if collecting user data).
- [ ] **Secure checkout** — HTTPS, recognizable payment flow.
- [ ] **Low intrusive interstitials** — especially on mobile (avoid full-screen popups on landing from search).

---

## 8. Off-page and authority (ongoing)

Not controlled in code, but required for competitive rankings:

- [ ] **Google Search Console** property verified.
- [ ] **Bing Webmaster Tools** (optional but easy win).
- [ ] **Google Business Profile** if you have a physical location.
- [ ] **Quality backlinks** — partnerships, local directories, press, blog mentions.
- [ ] **Consistent NAP** (name, address, phone) across web listings.

---

## 9. Content and keyword strategy

- [ ] **Keyword research** — what Persian terms users search (e.g. خرید کیک آنلاین, شیرینی خانگی).
- [ ] **Search intent mapping** — product pages for transactional; blog for informational.
- [ ] **Content calendar** — regular blog posts tied to products and seasons.
- [ ] **Avoid duplicate descriptions** — unique text per product and category.
- [ ] **Update stale pages** — refresh bestsellers, sales, and outdated copy.

---

## 10. Monitoring and maintenance

### Tools to run regularly

| Tool | What it checks |
|------|----------------|
| [Google Search Console](https://search.google.com/search-console) | Index coverage, clicks, Core Web Vitals, manual actions |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Performance, LCP/INP/CLS |
| [Rich Results Test](https://search.google.com/test/rich-results) | JSON-LD validity |
| [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly) | Mobile usability |
| Lighthouse (Chrome DevTools) | SEO, performance, accessibility audit |
| `site:yourdomain.com` in Google | Rough index count |

### Recurring tasks

- [ ] **Weekly** — Search Console coverage errors, 404s, crawl anomalies.
- [ ] **Monthly** — PageSpeed on home, top product, top blog post; fix regressions.
- [ ] **After deploy** — confirm sitemap updates, new routes have metadata, no accidental `noindex`.
- [ ] **After URL changes** — 301 redirects and sitemap refresh.

---

## 11. Implementation map (Next.js App Router)

Suggested files and patterns for this codebase:

```
frontend/src/app/
├── layout.tsx              # metadataBase, default metadata, OG defaults
├── robots.ts               # allow /, disallow /cart, /checkout, /profile, /auth/*
├── sitemap.ts              # static routes + dynamic slugs from API
├── page.tsx                # home metadata
├── products/
│   ├── page.tsx            # listing metadata
│   └── [slug]/page.tsx     # generateMetadata + Product JSON-LD
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx     # Article JSON-LD
├── courses/
│   ├── page.tsx
│   └── [slug]/page.tsx     # Course JSON-LD
├── about/page.tsx
├── contact/page.tsx
├── faq/page.tsx
└── not-found.tsx           # helpful 404
```

**`generateMetadata` example pattern** (product page):

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  return {
    title: `${product.title} | شیرینی‌خانه`,
    description: product.short_description ?? product.description?.slice(0, 160),
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.title,
      description: product.short_description,
      images: [{ url: product.main_image }],
      locale: "fa_IR",
      type: "website",
    },
  };
}
```

---

## 12. SEO score checklist (audit summary)

Use this condensed list for a quick pass/fail before sharing scores with stakeholders.

### Must pass (blocking)

- [ ] HTTPS live
- [ ] robots.txt + sitemap.xml
- [ ] Search Console verified
- [ ] Unique title + description on all public pages
- [ ] Canonical URLs
- [ ] Mobile-friendly
- [ ] No critical crawl errors in Search Console
- [ ] Core content visible without JS-only rendering
- [ ] Account/checkout pages not indexed

### Should pass (high impact)

- [ ] Open Graph / Twitter cards
- [ ] Product + Article structured data
- [ ] Image alt text on key pages
- [ ] LCP &lt; 2.5s mobile
- [ ] Internal linking between products, categories, blog
- [ ] 404 page useful
- [ ] Breadcrumb schema

### Nice to have (competitive edge)

- [ ] FAQ schema on FAQ page
- [ ] Aggregate ratings (real reviews only)
- [ ] Blog content strategy executing
- [ ] LocalBusiness schema
- [ ] hreflang (if multilingual)

---

## Related docs

- [Architecture](architecture.md) — frontend routing and API
- [Deploy staging](deploy.md) — production URL for Search Console
- [Project structure](project-structure.md) — `frontend/src/app/` layout
