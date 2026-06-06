"""
Create the PostgreSQL database if it does not exist.
Reads connection settings from backend/.env (loaded by Django settings).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg
from psycopg import sql

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402


def main() -> None:
    db = settings.DATABASES["default"]
    db_name = db["NAME"]
    admin_kwargs = {
        "dbname": "postgres",
        "user": db["USER"],
        "password": db["PASSWORD"],
        "host": db["HOST"],
        "port": db["PORT"],
    }

    if not admin_kwargs["password"]:
        print(
            "DB_PASSWORD is empty. Copy backend/.env.example to backend/.env "
            "and set your PostgreSQL password.",
            file=sys.stderr,
        )
        sys.exit(1)

    with psycopg.connect(**admin_kwargs, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,),
            )
            if cur.fetchone():
                print(f"Database '{db_name}' already exists.")
                return

            cur.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
            )
            print(f"Created database '{db_name}'.")


if __name__ == "__main__":
    main()
