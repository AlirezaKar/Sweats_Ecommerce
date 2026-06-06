"""Interactive superuser creator. Run from project root or scripts folder."""

import getpass
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from app_account.models import User  # noqa: E402


def prompt(label: str, required: bool = True) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value or not required:
            return value
        print("This field is required.")


def main() -> None:
    print("Create superuser")
    print("-" * 40)

    username = prompt("Username")
    password = getpass.getpass("Password: ")
    if not password:
        print("Password is required.")
        sys.exit(1)

    first_name = prompt("First name")
    last_name = prompt("Last name", required=False)
    phone = prompt("Phone (optional)", required=False) or None
    email = prompt("Email (optional)", required=False) or None

    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists. Nothing created.")
        return

    if phone and User.objects.filter(phone_number=phone).exists():
        print(f"Phone '{phone}' is already in use. Nothing created.")
        return

    User.objects.create_superuser(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone,
        email=email,
    )

    print("-" * 40)
    print("Superuser created successfully.")
    print(f"  Username: {username}")
    if phone:
        print(f"  Phone:    {phone}")
    if email:
        print(f"  Email:    {email}")


if __name__ == "__main__":
    main()
