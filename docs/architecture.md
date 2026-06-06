# Architecture

## Overview

```
┌─────────────────┐     HTTP (JSON)      ┌─────────────────┐
│  Next.js SPA    │ ◄──────────────────► │  Django REST    │
│  port 5173      │   Token + Session    │  port 8000      │
│  Persian RTL    │                      │  /api/*         │
└─────────────────┘                      └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │   PostgreSQL    │
                                       │ sweats_ecommerce│
                                       └─────────────────┘
```

The frontend is a client-rendered Next.js App Router application. It talks to the Django API over REST. Authentication uses DRF token auth (stored in browser) plus optional session auth for admin.

## Backend (Django)

### Project layout

| Path | Role |
|------|------|
| `backend/config/` | Settings, root URLs, WSGI, shared utils |
| `backend/app_api/` | Central `/api/` URL router (no models) |
| `backend/app_*/` | Domain apps (models, serializers, views) |
| `backend/media/` | Uploaded images (WebP conversion on save) |

### Django apps

| App | Status | Responsibility |
|-----|--------|----------------|
| `app_account` | Active | Custom `User`, addresses, login/register |
| `app_product` | Active | Categories, products, images, comments |
| `app_order` | Active | Cart, checkout, orders, payment callbacks |
| `app_payment` | Active | Wallet, transactions, Zarinpal / mock gateway |
| `app_content` | Active | Blog, courses, tutorials, enrollments |
| `app_chat` | Active | Support threads, messages, contact form |
| `app_shipping` | Planned | Iran shipping (stub) |
| `app_reporting` | Planned | Sales reports (stub) |
| `app_analytics` | Planned | Traffic / metrics (stub) |
| `app_main` | Planned | Health / site config (stub) |

### API routing

All public API routes are registered in `backend/app_api/urls.py` and mounted at `/api/` from `backend/config/urls.py`.

Admin is at `/admin/`.

### Cross-cutting concerns

- **Locale:** `fa`, timezone `Asia/Tehran`
- **Auth:** `AUTH_USER_MODEL = app_account.User`; DRF TokenAuthentication
- **CORS:** localhost / 127.0.0.1 on ports 5173 and 3000
- **Payments:** Amounts in Toman in API; Zarinpal uses Rial (×10)
- **Images:** Pillow + WebP pipeline in `config/utils/images.py`

## Frontend (Next.js)

### Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Routes | `src/app/` | Page entry points (`page.tsx` + `*Client.tsx`) |
| Components | `src/components/` | UI by domain (product, cart, blog, …) |
| Context | `src/context/` | `AuthContext`, `CartContext` |
| API client | `src/lib/api/` | Fetch wrappers per resource |
| Constants | `src/lib/constants/` | Routes, endpoints, nav, locale |
| i18n | `src/lib/i18n/fa.ts` | Persian UI strings |
| Types | `src/types/api.ts` | Shared TypeScript types |

### State

- **Auth:** token in `localStorage`, user from `/api/auth/me/`
- **Cart:** guest cart in `localStorage`; merged on login via `/api/cart/merge/`
- **No global state library** — React Context only

### Styling

Tailwind CSS v4, RTL layout (`dir="rtl"`), Vazirmatn font.

## Request flow (example: checkout)

1. User fills checkout in `CheckoutPageClient.tsx`
2. Frontend POSTs to `/api/checkout/` with token + address
3. `app_order` creates `Order`, may redirect to Zarinpal or wallet debit
4. Callback hits `/api/orders/payment/callback/` or wallet endpoints
5. Frontend polls or redirects to order detail page

## Planned extensions

From project planning (see `plan/` locally):

- Iran-specific shipping rates and provinces
- SMS / email verification
- Staff dashboard and analytics exports
- Floating support widget (API exists; UI partial)
