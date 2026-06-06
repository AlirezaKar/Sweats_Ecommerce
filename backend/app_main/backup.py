from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class BackupError(Exception):
    pass


@dataclass(frozen=True)
class BackupFile:
    filename: str
    size_bytes: int
    created_at: datetime

    def as_dict(self) -> dict:
        return {
            "filename": self.filename,
            "size_bytes": self.size_bytes,
            "created_at": self.created_at.isoformat(),
        }


def get_backup_dir() -> Path:
    backup_dir = Path(getattr(settings, "BACKUP_DIR", settings.BASE_DIR.parent / "backup"))
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


def default_backup_filename() -> str:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    db_name = settings.DATABASES["default"].get("NAME", "database")
    if isinstance(db_name, str):
        safe_db = re.sub(r"[^\w\-]", "_", db_name)
    else:
        safe_db = "database"
    return f"backup_{safe_db}_{stamp}.sql"


def sanitize_backup_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        return default_backup_filename()

    cleaned = Path(cleaned).name
    cleaned = re.sub(r"[^\w\-.]", "_", cleaned)
    if not cleaned:
        raise BackupError("نام پشتیبان معتبر نیست.")

    if not cleaned.lower().endswith(".sql"):
        cleaned = f"{cleaned}.sql"
    return cleaned


def _resolve_unique_path(directory: Path, filename: str) -> Path:
    candidate = directory / filename
    if not candidate.exists():
        return candidate

    stem = candidate.stem
    suffix = candidate.suffix
    counter = 1
    while True:
        candidate = directory / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def _pg_dump_path() -> str:
    configured = getattr(settings, "PG_DUMP_PATH", "") or ""
    if configured:
        return configured
    found = shutil.which("pg_dump")
    if not found:
        raise BackupError(
            "ابزار pg_dump یافت نشد. PostgreSQL client را نصب کنید یا PG_DUMP_PATH را در تنظیمات مشخص کنید."
        )
    return found


def _create_postgresql_backup(destination: Path) -> None:
    db = settings.DATABASES["default"]
    cmd = [
        _pg_dump_path(),
        "--no-owner",
        "--no-acl",
        "-f",
        str(destination),
    ]

    host = db.get("HOST")
    port = db.get("PORT")
    user = db.get("USER")
    name = db.get("NAME")

    if host:
        cmd.extend(["-h", str(host)])
    if port:
        cmd.extend(["-p", str(port)])
    if user:
        cmd.extend(["-U", str(user)])
    if name:
        cmd.append(str(name))

    env = None
    password = db.get("PASSWORD")
    if password:
        import os

        env = os.environ.copy()
        env["PGPASSWORD"] = str(password)

    try:
        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip()
        raise BackupError(detail or "pg_dump با خطا متوقف شد.") from exc


def _create_sqlite_backup(destination: Path) -> None:
    db = settings.DATABASES["default"]
    db_path = db.get("NAME")
    if not db_path:
        raise BackupError("مسیر پایگاه داده SQLite مشخص نیست.")
    source = Path(str(db_path))
    if not source.is_file():
        raise BackupError(f"فایل پایگاه داده یافت نشد: {source}")
    shutil.copy2(source, destination)


def create_database_backup(name: str = "") -> BackupFile:
    engine = settings.DATABASES["default"]["ENGINE"]
    backup_dir = get_backup_dir()
    filename = sanitize_backup_name(name)
    destination = _resolve_unique_path(backup_dir, filename)

    if "postgresql" in engine:
        _create_postgresql_backup(destination)
    elif "sqlite" in engine:
        _create_sqlite_backup(destination)
    else:
        raise BackupError(f"موتور پایگاه داده پشتیبانی نمی‌شود: {engine}")

    if not destination.is_file() or destination.stat().st_size == 0:
        destination.unlink(missing_ok=True)
        raise BackupError("فایل پشتیبان ایجاد نشد یا خالی است.")

    stat = destination.stat()
    created_at = datetime.fromtimestamp(stat.st_mtime)
    return BackupFile(
        filename=destination.name,
        size_bytes=stat.st_size,
        created_at=created_at,
    )


def list_database_backups() -> list[BackupFile]:
    backup_dir = get_backup_dir()
    files: list[BackupFile] = []
    for path in sorted(backup_dir.glob("*.sql"), key=lambda p: p.stat().st_mtime, reverse=True):
        stat = path.stat()
        files.append(
            BackupFile(
                filename=path.name,
                size_bytes=stat.st_size,
                created_at=datetime.fromtimestamp(stat.st_mtime),
            )
        )
    return files


def get_backup_file_path(filename: str) -> Path:
    safe_name = sanitize_backup_name(filename)
    backup_dir = get_backup_dir()
    path = (backup_dir / safe_name).resolve()
    if backup_dir.resolve() not in path.parents and path != backup_dir.resolve():
        raise BackupError("مسیر فایل نامعتبر است.")
    if not path.is_file():
        raise BackupError("فایل پشتیبان یافت نشد.")
    return path


def ensure_backup_available() -> None:
    engine = settings.DATABASES["default"]["ENGINE"]
    if "postgresql" in engine:
        _pg_dump_path()
    elif "sqlite" in engine:
        db_path = settings.DATABASES["default"].get("NAME")
        if not db_path:
            raise ImproperlyConfigured("DATABASE NAME is required for SQLite backups.")
