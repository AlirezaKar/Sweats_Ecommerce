# Deploy to free staging (Vercel + Railway)

This guide puts your **Next.js frontend on Vercel** and your **Django API + PostgreSQL on Railway**, so you get a permanent public URL without buying a domain.

| Part | Service | Example URL |
|------|---------|-------------|
| Frontend | [Vercel](https://vercel.com) | `https://sweats-shop.vercel.app` |
| API + DB | [Railway](https://railway.app) | `https://sweats-api.up.railway.app` |

**Cost:** Railway gives a small monthly credit on the free trial; Vercel hobby tier is free for personal projects. Good enough for demos and staging.

---

## Before you start

1. Push your code to **GitHub** (Railway and Vercel deploy from Git).
2. Confirm the app runs locally (`start-all-dev.cmd`).
3. Generate a production secret key (save it somewhere safe):

```cmd
.venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Part 1 — Railway (PostgreSQL + Django API)

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) → sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select `Sweats_E_commerce`.
3. Railway creates a service — open it → **Settings**:
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**` (optional, avoids redeploy on frontend-only changes)

### 2. Add PostgreSQL

1. In the project canvas: **+ New** → **Database** → **PostgreSQL**.
2. Click the Postgres service → **Variables** → copy `DATABASE_URL` (or use **Connect** → Railway auto-links it to your web service).

### 3. Configure the web service environment variables

Open your **Django web service** → **Variables** → add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference — pick from variable picker) |
| `DJANGO_SECRET_KEY` | your generated secret key |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | `your-api.up.railway.app` (your real Railway hostname, no `https://`) |
| `DJANGO_CORS_ORIGINS` | `https://your-app.vercel.app` (fill after Vercel deploy — step 2 below) |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://your-app.vercel.app` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `SERVE_MEDIA` | `true` |
| `PAYMENT_GATEWAY_MOCK` | `true` |
| `ZARINPAL_SANDBOX` | `true` |

You can deploy once with placeholder Vercel URL, then update CORS/FRONTEND after Part 2.

### 4. Deploy

Railway reads `backend/railway.toml` and `Procfile` automatically:

- Installs `requirements.txt`
- Runs `collectstatic`
- On start: `migrate` + `gunicorn`

**Settings → Networking → Generate Domain** → copy the public URL (e.g. `https://sweats-api-production.up.railway.app`).

Test: open `https://YOUR-API.up.railway.app/api/categories/` — you should see JSON.

### 5. Create admin user & seed data

**Create superuser (Railway CLI)**

```bash
npm i -g @railway/cli
railway login
cd backend
railway link
railway run python manage.py createsuperuser
```

**Seed demo data from your PC** (uses Railway’s database over the network):

1. Copy `DATABASE_URL` from Railway Postgres → Variables.
2. In PowerShell from the repo root:

```powershell
$env:DATABASE_URL = "postgresql://..."   # paste from Railway
$env:DJANGO_DEBUG = "false"
$env:DJANGO_SECRET_KEY = "same-key-as-railway"
.\.venv\Scripts\python.exe scripts\seed_dummy_data.py --users 5 --products 20 --courses 2
```

Admin panel: `https://YOUR-API.up.railway.app/admin/`

---

## Part 2 — Vercel (Next.js frontend)

### 1. Import project

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New** → **Project** → import `Sweats_E_commerce`.
3. **Root Directory:** `frontend` (click Edit → set to `frontend`).

### 2. Environment variables

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.up.railway.app` (Railway URL, no trailing slash) |

### 3. Deploy

Click **Deploy**. Vercel builds Next.js and gives you a URL like `https://sweats-e-commerce.vercel.app`.

### 4. Update Railway CORS

Go back to Railway → web service **Variables** → set:

```
DJANGO_CORS_ORIGINS=https://sweats-e-commerce.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://sweats-e-commerce.vercel.app
FRONTEND_URL=https://sweats-e-commerce.vercel.app
```

Redeploy the API (or wait for auto-redeploy).

---

## Part 3 — Verify the staging site

| Check | URL |
|-------|-----|
| Shop home | `https://your-app.vercel.app` |
| API health | `https://your-api.up.railway.app/api/products/` |
| Admin | `https://your-api.up.railway.app/admin/` |

Demo login (if seeded): `user0001` / `testpass123`

---

## Custom domain (optional, later)

- **Vercel:** Project → Settings → Domains → add your domain.
- **Railway:** Service → Settings → Custom Domain → add `api.yourdomain.com`.
- Update `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ORIGINS`, `FRONTEND_URL`, and `NEXT_PUBLIC_API_URL` accordingly.

---

## Important staging limitations

### Uploaded images / course files

With `SERVE_MEDIA=true`, files are stored on the Railway container disk. They **may disappear** when Railway redeploys or restarts. Fine for demos — re-upload or re-run the seed script after redeploy.

For production later, use object storage (S3, Cloudflare R2, etc.).

### Free tier sleep / credits

- **Railway:** Uses monthly usage credits; heavy traffic or always-on may need a paid plan.
- **Render alternative:** Free web services sleep after inactivity (slow first load). See [Render deploy](#render-alternative) below.

### Payments

Keep `PAYMENT_GATEWAY_MOCK=true` on staging. Real Zarinpal needs a public `FRONTEND_URL` and merchant ID.

---

## Render alternative (fully free, slower cold starts)

If you prefer Render over Railway:

1. **New +** → **PostgreSQL** (free — note 90-day expiry on free DB).
2. **New +** → **Web Service** → connect repo, **Root Directory** `backend`.
3. **Build command:**
   ```
   pip install -r requirements.txt && python manage.py collectstatic --noinput
   ```
4. **Start command:**
   ```
   python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```
5. Add the same env vars as Railway; set `DATABASE_URL` from Render Postgres **Internal Database URL**.

Point Vercel `NEXT_PUBLIC_API_URL` at your Render URL (`https://sweats-api.onrender.com`).

---

## Environment variable reference

| Variable | Local dev | Staging |
|----------|-----------|---------|
| `DJANGO_DEBUG` | `true` | `false` |
| `DJANGO_SECRET_KEY` | optional | **required** |
| `DATABASE_URL` | — | from host (Railway/Render) |
| `DJANGO_ALLOWED_HOSTS` | optional | API hostname |
| `DJANGO_CORS_ORIGINS` | optional | Vercel URL |
| `FRONTEND_URL` | `http://localhost:5173` | Vercel URL |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Railway/Render URL |
| `SERVE_MEDIA` | `false` | `true` |
| `PAYMENT_GATEWAY_MOCK` | `true` | `true` |

---

## Troubleshooting

### CORS error in browser

`DJANGO_CORS_ORIGINS` must exactly match the Vercel URL (`https://`, no trailing slash).

### DisallowedHost

Add your Railway hostname to `DJANGO_ALLOWED_HOSTS` (hostname only, not full URL).

### Images broken on Vercel

`NEXT_PUBLIC_API_URL` must be set **before** build. Redeploy Vercel after changing it.

### 502 / timeout on Railway

Check deploy logs. Often missing `DATABASE_URL` or failed `migrate`.

### Admin login CSRF failed

Add Vercel + API URLs to `DJANGO_CSRF_TRUSTED_ORIGINS`.
