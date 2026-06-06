# Database

The project uses **PostgreSQL** installed locally as the primary database. SQLite is no longer configured.

## Configuration

Settings live in `backend/config/settings.py` and read from `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_NAME` | `sweats_ecommerce` | Database name |
| `DB_USER` | `postgres` | Role / user |
| `DB_PASSWORD` | — | **Required** — password from PostgreSQL install |
| `DB_HOST` | `127.0.0.1` | Host |
| `DB_PORT` | `5432` | Port (standard local default) |

Copy `backend/.env.example` to `backend/.env` before first run.

## Install PostgreSQL (Windows)

1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (16+).
2. Run the installer; keep the default port **5432**.
3. Set a password for the `postgres` superuser — you will put this in `DB_PASSWORD`.
4. After install, confirm the Windows service is running:
   - `Win + R` → `services.msc` → find `postgresql-x64-*` → **Running**

## First-time project setup

1. Copy and edit env:

```cmd
copy backend\.env.example backend\.env
```

2. Set your install password in `backend/.env`:

```env
DB_PASSWORD=the_password_you_chose_during_install
```

3. Create the database and run migrations:

```cmd
scripts\setup-postgres.cmd
```

`scripts/setup_postgres.py` connects to the built-in `postgres` database, creates `sweats_ecommerce` if it does not exist, then `manage.py migrate` applies all migrations.

## Verify connection manually (optional)

If `psql` is on your PATH (or use the full path under `C:\Program Files\PostgreSQL\<version>\bin\`):

```cmd
psql -U postgres -h 127.0.0.1 -p 5432 -d sweats_ecommerce
```

## Migrations

```cmd
scripts\django.cmd makemigrations
scripts\django.cmd migrate
```

Migration files are per Django app under `backend/app_*/migrations/`.

## Django admin

After migrate + superuser:

http://127.0.0.1:8000/admin/

## Driver

Python dependency: `psycopg[binary]>=3.1` (listed in `backend/requirements.txt`).

## Legacy SQLite

`db.sqlite3` files are gitignored. If you have an old SQLite file with data you need, export it manually before switching — the project no longer reads from SQLite.

## Alternative: Docker (not used by default)

A `docker-compose.yml` exists at the repo root for teams that prefer containers. This project is set up for **local PostgreSQL on port 5432** and does not require Docker. Only use compose if you explicitly want an isolated container database on port **5433**.
