# API overview

Base URL: `http://127.0.0.1:8000`

All endpoints below are prefixed with `/api/`. Authentication: `Authorization: Token <token>` unless noted.

Source of truth: `backend/app_api/urls.py` and `frontend/src/lib/constants/endpoints.ts`.

## Auth & account

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `auth/login/` | No | Login → token |
| POST | `auth/register/` | No | Register → token |
| POST | `auth/logout/` | Yes | Invalidate token |
| GET | `auth/me/` | Yes | Current user profile |
| GET, POST | `addresses/` | Yes | List / create addresses |
| GET, PUT, PATCH, DELETE | `addresses/<id>/` | Yes | Address detail |

## Catalog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `categories/` | No | Product categories |
| GET | `products/` | No | Product list (filters via query params) |
| GET | `products/<slug>/` | No | Product detail |
| GET | `products/<slug>/related/` | No | Related products |
| POST | `products/<slug>/comments/` | Yes | Add product comment |

## Cart & orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `cart/` | Optional | Cart (session or user) |
| POST | `cart/items/` | Optional | Add line item |
| PATCH | `cart/items/<id>/` | Optional | Update quantity |
| DELETE | `cart/items/<id>/remove/` | Optional | Remove item |
| POST | `cart/merge/` | Yes | Merge guest cart after login |
| POST | `checkout/` | Yes | Place order |
| GET | `orders/payment/callback/` | No | Zarinpal order callback |
| GET | `orders/` | Yes | Order history |
| GET | `orders/<id>/` | Yes | Order detail |

## Wallet & payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `wallet/` | Yes | Wallet balance |
| GET | `wallet/transactions/` | Yes | Transaction history |
| POST | `wallet/top-up/` | Yes | Start top-up (Zarinpal) |
| GET | `wallet/top-up/callback/` | No | Zarinpal top-up callback |
| GET | `wallet/top-up/mock/` | Yes* | Mock top-up (dev only) |
| POST | `wallet/pay-order/<order_id>/` | Yes | Pay order from wallet |

\* Mock endpoint active when `PAYMENT_GATEWAY_MOCK=true` in settings.

## Content

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `blog/` | No | Blog post list |
| GET | `blog/<slug>/` | No | Blog post detail |
| POST | `blog/<slug>/comments/` | Yes | Blog comment |
| GET | `courses/` | No | Course list |
| GET | `courses/<slug>/` | No | Course detail |
| POST | `courses/<slug>/enroll/` | Yes | Enroll (free) or start purchase |
| GET | `courses/<slug>/files/` | Yes | Course materials (enrolled users only) |
| GET | `courses/purchase/callback/` | No | Paid course callback |
| POST | `courses/<slug>/reviews/` | Yes | Course review |
| GET | `courses/<slug>/reviews/mine/` | Yes | User's review |
| GET | `tutorials/` | No | Tutorial list |
| GET | `tutorials/<slug>/` | No | Tutorial detail |

## Support

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `support/thread/` | Yes | User's support thread |
| POST | `support/messages/` | Yes | Send support message |
| POST | `contact/` | No | Public contact form |

## Admin

Django admin: `/admin/` — session-based staff login.

## Pagination

List endpoints use DRF page-number pagination (`PAGE_SIZE = 24` in settings).

## Errors

Standard DRF JSON error bodies. Common status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found.
