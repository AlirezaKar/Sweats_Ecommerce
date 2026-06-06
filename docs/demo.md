# Sharing a live demo (no domain or hosting)

Three ways to show the site, from fastest to most flexible.

## Option 1 — Screen share (fastest)

Run the app locally with `start-all-dev.cmd`, then share your screen in Zoom, Discord, or Google Meet.

- **Pros:** No config, works immediately
- **Cons:** Only live; viewers cannot click around on their own device

---

## Option 2 — Same Wi‑Fi / LAN (people in the same room)

Good when everyone is on the same network (home, office, classroom).

### 1. Find your PC’s IP

```cmd
ipconfig
```

Use the **IPv4 Address** (e.g. `192.168.1.42`).

### 2. Start backend (listen on all interfaces)

```cmd
scripts\django.cmd runserver 0.0.0.0:8000
```

### 3. Start frontend

```cmd
cd frontend
set NEXT_PUBLIC_API_URL=http://192.168.1.42:8000
npm run dev -- -H 0.0.0.0 -p 5173
```

Replace `192.168.1.42` with your IP.

### 4. Allow your IP in Django (one-time per session)

In `backend/.env` add (use your IP):

```env
DJANGO_ALLOWED_HOSTS=192.168.1.42
DJANGO_CORS_ORIGINS=http://192.168.1.42:5173
```

Restart the API after editing `.env`.

### 5. Share this link

```
http://192.168.1.42:5173
```

**Note:** Windows Firewall may block incoming connections — allow Python and Node when prompted.

---

## Option 3 — Public link via tunnel (anyone on the internet)

Use a tunnel when viewers are remote. [ngrok](https://ngrok.com/) is the simplest free option.

### Prerequisites

- PostgreSQL running locally
- Site works on `localhost` first (`start-all-dev.cmd`)
- ngrok account + `ngrok` installed and authenticated

### Steps

**Terminal 1 — API**

```cmd
scripts\django.cmd runserver 0.0.0.0:8000
```

**Terminal 2 — ngrok for API**

```cmd
ngrok http 8000
```

Copy the **HTTPS** URL, e.g. `https://abc123.ngrok-free.app`.

**Terminal 3 — Frontend** (use the ngrok API URL)

```cmd
cd frontend
set NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app
npm run dev -- -p 5173
```

**Terminal 4 — ngrok for frontend**

```cmd
ngrok http 5173
```

Copy the frontend HTTPS URL, e.g. `https://xyz789.ngrok-free.app`.

**Update `backend/.env`** (use your real ngrok hostnames, no paths):

```env
FRONTEND_URL=https://xyz789.ngrok-free.app
DJANGO_ALLOWED_HOSTS=abc123.ngrok-free.app
DJANGO_CORS_ORIGINS=https://xyz789.ngrok-free.app
```

Restart the API (`scripts\django.cmd runserver 0.0.0.0:8000`).

**Share with viewers:** `https://xyz789.ngrok-free.app`

### Demo tips

- Seed data first: `scripts\seed-dummy-data.cmd`
- Demo login: `user0001` / `testpass123` (if you ran the seeder)
- Payments use **mock mode** by default (`PAYMENT_GATEWAY_MOCK=true`) — fine for demos
- ngrok free URLs change each time you restart ngrok; update `.env` when they change
- Keep your PC on and connected; the tunnel only works while your machine is running

### Alternatives to ngrok

| Tool | Notes |
|------|--------|
| [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | Free, stable URLs with a named tunnel |
| [localtunnel](https://localtunnel.github.io/www/) | `npx localtunnel --port 5173` — quick, less reliable |

---

## Option 4 — Free staging (longer-term)

If you need a link that stays up without your PC:

| Part | Service |
|------|---------|
| Frontend | [Vercel](https://vercel.com) (Next.js) |
| Backend | [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io) |
| Database | Managed PostgreSQL on the same platform |

This needs production settings (secret key, `DEBUG=False`, env vars). Use Options 1–3 for quick demos; Option 4 when you are ready to deploy for real.
