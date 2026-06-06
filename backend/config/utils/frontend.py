"""Build absolute URLs on the Next.js storefront after payment callbacks."""

from __future__ import annotations

from urllib.parse import urlencode, urlparse

from django.conf import settings
from django.core.cache import cache

RETURN_ORIGIN_CACHE_PREFIX = "payment_return_origin:"
RETURN_ORIGIN_TTL = 60 * 60


def normalize_origin(value: str | None) -> str | None:
    if not value:
        return None
    origin = value.strip().rstrip("/")
    if not origin.startswith(("http://", "https://")):
        return None
    return origin


def get_default_frontend_origin() -> str:
    return normalize_origin(settings.FRONTEND_URL) or "http://localhost:5173"


def origin_from_request(request) -> str | None:
    data = getattr(request, "data", None) or {}
    origin = ""
    if isinstance(data, dict):
        origin = str(data.get("frontend_origin") or "").strip()
    if not origin:
        origin = (request.headers.get("Origin") or "").strip()
    if not origin:
        referer = (request.headers.get("Referer") or "").strip()
        if referer.startswith("http"):
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                origin = f"{parsed.scheme}://{parsed.netloc}"
    return normalize_origin(origin)


def store_payment_return_origin(authority: str, origin: str) -> None:
    cleaned = normalize_origin(origin)
    if not authority or not cleaned:
        return
    cache.set(f"{RETURN_ORIGIN_CACHE_PREFIX}{authority}", cleaned, RETURN_ORIGIN_TTL)


def pop_payment_return_origin(authority: str) -> str:
    if not authority:
        return get_default_frontend_origin()
    key = f"{RETURN_ORIGIN_CACHE_PREFIX}{authority}"
    origin = cache.get(key)
    if origin:
        cache.delete(key)
        return normalize_origin(origin) or get_default_frontend_origin()
    return get_default_frontend_origin()


def build_frontend_url(path: str, *, authority: str = "", **query) -> str:
    origin = pop_payment_return_origin(authority) if authority else get_default_frontend_origin()
    if not path.startswith("/"):
        path = f"/{path}"
    url = f"{origin}{path}"
    if query:
        url = f"{url}?{urlencode(query)}"
    return url
