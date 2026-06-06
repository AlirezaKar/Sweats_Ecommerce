# Documentation

Developer documentation for the Sweats E-commerce project.

## Guides

- **[Setup](setup.md)** — prerequisites, install, run, seed data, troubleshooting
- **[Database](database.md)** — Local PostgreSQL install, migrations, env vars
- **[Architecture](architecture.md)** — backend apps, frontend layers, data flow
- **[API overview](api.md)** — REST endpoints grouped by domain
- **[Project structure](project-structure.md)** — full directory tree and diagrams
- **[Live demo](demo.md)** — share locally without hosting (LAN, ngrok, screen share)
- **[Deploy staging](deploy.md)** — permanent public demo on Vercel + Railway (free tier)
- **[SEO checklist](seo-checklist.md)** — technical, on-page, and e-commerce SEO requirements with checkboxes

## Quick links

| Task | Command |
|------|---------|
| Start dev stack | `start-all-dev.cmd` |
| Django shell / migrate | `scripts\django.cmd <command>` |
| Create database + migrate | `scripts\setup-postgres.cmd` |
| Seed dummy data | `scripts\seed-dummy-data.cmd` |
| Git Flow helpers | `scripts\helper\GIT_HELP.md` |

## Related files

- Root [README.md](../README.md) — project overview
- [backend/.env.example](../backend/.env.example) — backend environment template
- [plan/project-structure.md](../plan/project-structure.md) — structure sketch (also in `docs/`)
