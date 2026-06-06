# Development setup

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.12+ | Virtualenv at repo root (`.venv`) |
| Node.js | 20+ | For `frontend/` |
| PostgreSQL | 16+ | Installed locally on port `5432` ([database.md](database.md)) |
| Git | any | Optional: `scripts/helper/` git-flow cmds |

## First-time setup

### 1. Clone and create Python venv

```cmd
cd Sweats_E_commerce
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Root `requirements.txt` includes `backend/requirements.txt`.

### 2. Configure backend environment

```cmd
copy backend\.env.example backend\.env
```

Edit `backend/.env` and set at minimum:

```env
DB_PASSWORD=your_postgres_password
```

Other defaults are fine for local development.

### 3. Install and start PostgreSQL (if needed)

Install [PostgreSQL for Windows](https://www.postgresql.org/download/windows/) (16 or newer). During setup, note the password you choose for the `postgres` user.

Confirm the service is running:

- **Windows:** Services → `postgresql-x64-*` → Running
- Default connection: `127.0.0.1:5432`

### 4. Initialize the database

```cmd
scripts\setup-postgres.cmd
```

This creates the `sweats_ecommerce` database (if missing) and runs migrations.

### 5. Install frontend dependencies

```cmd
cd frontend
npm install
cd ..
```

Optional `frontend/.env.local` (see also `frontend/.env.example`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set `NEXT_PUBLIC_SITE_URL` to your public storefront URL in production (canonical links, sitemap, Open Graph).

### 6. Create admin user

```cmd
scripts\django.cmd createsuperuser
```

Or use the helper script:

```cmd
python scripts\create_superuser.py
```

### 7. Seed sample data (optional)

```cmd
scripts\seed-dummy-data.cmd
```

Populates products, blog posts, courses, orders, wallet data, and test users.

## Running the app

### Both services (recommended)

```cmd
start-all-dev.cmd
```

Opens two terminal windows:

- API: http://127.0.0.1:8000/
- SPA: http://127.0.0.1:5173/

### Individual services

**Backend:**

```cmd
scripts\django.cmd runserver 8000
```

**Frontend:**

```cmd
cd frontend
npm run dev -- -p 5173
```

## Common Django commands

All go through `scripts\django.cmd`:

```cmd
scripts\django.cmd migrate
scripts\django.cmd makemigrations
scripts\django.cmd shell
scripts\django.cmd collectstatic
```

## Payments in development

With defaults in `backend/.env`:

- `PAYMENT_GATEWAY_MOCK=true` — wallet top-up uses `/api/wallet/top-up/mock/` instead of Zarinpal
- `ZARINPAL_SANDBOX=true` — sandbox when a merchant ID is set

Set `FRONTEND_URL` to match where the Next.js app runs (default `http://localhost:5173`).

## Troubleshooting

### `DB_PASSWORD is empty`

Set `DB_PASSWORD` in `backend/.env` and rerun `scripts\setup-postgres.cmd`.

### Connection refused (PostgreSQL)

- Confirm the PostgreSQL service is running (Windows: Services → `postgresql-x64-*`)
- Defaults in `backend/.env` are `DB_HOST=127.0.0.1` and `DB_PORT=5432` — change only if your install differs
- Verify `DB_PASSWORD` matches the password set when PostgreSQL was installed

### CORS errors from frontend

Backend allows `http://localhost:5173` and `http://127.0.0.1:5173`. If you use another port, add it to `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`.

### Frontend cannot load product images

`frontend/next.config.ts` whitelists the Django media host. Ensure `NEXT_PUBLIC_API_URL` points at the running API.

### Module not found (`psycopg`)

```cmd
pip install -r requirements.txt
```
