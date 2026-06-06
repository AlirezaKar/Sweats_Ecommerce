# Sweats E-commerce

Persian (RTL) e-commerce platform for homemade sweets and cakes. The stack is a **Django 6 REST API** backend and a **Next.js 16** frontend, backed by **PostgreSQL**.

| Service   | URL                      | Port |
|-----------|--------------------------|------|
| API       | http://127.0.0.1:8000/   | 8000 |
| Frontend  | http://127.0.0.1:5173/   | 5173 |
| Admin     | http://127.0.0.1:8000/admin/ | 8000 |

## Features

- Product catalog with categories, images, and comments
- User accounts (phone/email), addresses, token auth
- Cart, checkout, orders, and wallet payments
- Zarinpal gateway (with mock mode for local dev)
- Blog, tutorials, and paid/free courses
- Support chat threads and contact form
- Django admin for content and orders

## Quick start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ installed locally (default port `5432`)

### 1. Python environment

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database

Copy env template and set your Postgres password:

```cmd
copy backend\.env.example backend\.env
```

Edit `backend/.env` and set `DB_PASSWORD`, then:

```cmd
scripts\setup-postgres.cmd
```

See [docs/database.md](docs/database.md) for PostgreSQL install and configuration.

### 3. Frontend

```cmd
cd frontend
npm install
```

Optional: create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 4. Run everything

```cmd
start-all-dev.cmd
```

Or run services separately:

```cmd
scripts\django.cmd runserver 8000
cd frontend && npm run dev -- -p 5173
```

### 5. Seed data (optional)

```cmd
scripts\seed-dummy-data.cmd
scripts\django.cmd createsuperuser
```

## Project layout

```
Sweats_E_commerce/
├── backend/          Django project (API, admin, models)
├── frontend/         Next.js App Router SPA (Persian RTL)
├── scripts/          Dev helpers (Django, Postgres, seed, git)
├── docs/             Project documentation
└── start-all-dev.cmd    Start API + frontend
```

Full structure diagram: [docs/project-structure.md](docs/project-structure.md) and [plan/project-structure.md](plan/project-structure.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/setup.md](docs/setup.md) | Detailed development setup |
| [docs/database.md](docs/database.md) | PostgreSQL configuration |
| [docs/architecture.md](docs/architecture.md) | System design and app map |
| [docs/api.md](docs/api.md) | REST API overview |
| [docs/project-structure.md](docs/project-structure.md) | Directory tree and diagrams |
| [docs/deploy.md](docs/deploy.md) | Deploy staging to Vercel + Railway |
| [scripts/helper/GIT_HELP.md](scripts/helper/GIT_HELP.md) | Git Flow helpers (Windows) |

## Tech stack

**Backend:** Django 6, Django REST Framework, PostgreSQL (`psycopg`), Pillow, django-cors-headers

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Vazirmatn font

## Environment variables

Backend (`backend/.env`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_NAME` | `sweats_ecommerce` | PostgreSQL database |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | **Required** |
| `DB_HOST` | `127.0.0.1` | Database host |
| `DB_PORT` | `5432` | Database port |
| `FRONTEND_URL` | `http://localhost:5173` | Payment redirects |
| `ZARINPAL_MERCHANT_ID` | — | Live payments |
| `ZARINPAL_SANDBOX` | `true` | Sandbox mode |
| `PAYMENT_GATEWAY_MOCK` | `true` | Mock wallet top-up in dev |

## License

Private project — all rights reserved.
