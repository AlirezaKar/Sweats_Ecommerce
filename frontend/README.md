# Frontend

Next.js 16 App Router SPA for Sweats E-commerce (Persian RTL).

## Commands

```bash
npm install
npm run dev -- -p 5173    # dev server (port 5173)
npm run build
npm run start
npm run lint
```

## Environment

Optional `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Structure

| Path | Purpose |
|------|---------|
| `src/app/` | Routes and pages |
| `src/components/` | UI components |
| `src/context/` | Auth and cart state |
| `src/lib/api/` | REST API client |
| `src/lib/constants/` | Routes, endpoints, nav |
| `src/lib/i18n/fa.ts` | Persian strings |

## Full documentation

See the repo root [README.md](../README.md) and [docs/](../docs/).
