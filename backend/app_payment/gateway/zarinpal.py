"""Zarinpal payment gateway (amounts in project are Toman; gateway uses Rial)."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from urllib import error, request
from urllib.parse import urlencode

from django.conf import settings
from django.urls import reverse

from app_payment.models import WalletTransaction


class PaymentGatewayError(Exception):
    pass


@dataclass(frozen=True)
class PaymentStartResult:
    authority: str
    payment_url: str


def _tomans_to_rials(amount_toman: int) -> int:
    return amount_toman * 10


def _api_base() -> str:
    if getattr(settings, "ZARINPAL_SANDBOX", True):
        return "https://sandbox.zarinpal.com/pg/v4/payment"
    return "https://payment.zarinpal.com/pg/v4/payment"


def _start_pay_base() -> str:
    if getattr(settings, "ZARINPAL_SANDBOX", True):
        return "https://sandbox.zarinpal.com/pg/StartPay"
    return "https://www.zarinpal.com/pg/StartPay"


def _post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        raise PaymentGatewayError(f"خطا در ارتباط با درگاه پرداخت ({exc.code}).") from exc
    except error.URLError as exc:
        raise PaymentGatewayError("اتصال به درگاه پرداخت برقرار نشد.") from exc


def _merchant_id() -> str:
    merchant_id = getattr(settings, "ZARINPAL_MERCHANT_ID", "") or ""
    if not merchant_id.strip():
        raise PaymentGatewayError(
            "درگاه پرداخت پیکربندی نشده است. ZARINPAL_MERCHANT_ID را در تنظیمات قرار دهید."
        )
    return merchant_id.strip()


def _mock_enabled() -> bool:
    return getattr(settings, "PAYMENT_GATEWAY_MOCK", False) and settings.DEBUG


def _callback_url(http_request, callback_view_name: str) -> str:
    return http_request.build_absolute_uri(reverse(callback_view_name))


def _mock_payment_url(http_request, authority: str, callback_view_name: str) -> str:
    path = reverse("api-wallet-top-up-mock")
    callback = _callback_url(http_request, callback_view_name)
    query = urlencode({"authority": authority, "callback": callback})
    return http_request.build_absolute_uri(f"{path}?{query}")


def initiate_payment(
    *,
    amount_toman: int,
    description: str,
    callback_view_name: str,
    http_request,
    metadata: dict | None = None,
) -> PaymentStartResult:
    if _mock_enabled():
        authority = f"MOCK-{uuid.uuid4().hex[:16].upper()}"
        return PaymentStartResult(
            authority=authority,
            payment_url=_mock_payment_url(http_request, authority, callback_view_name),
        )

    merchant_id = _merchant_id()
    payload = {
        "merchant_id": merchant_id,
        "amount": _tomans_to_rials(amount_toman),
        "callback_url": _callback_url(http_request, callback_view_name),
        "description": description[:255],
        "metadata": metadata or {},
    }

    data = _post_json(f"{_api_base()}/request.json", payload)
    errors = data.get("errors")
    if errors:
        code = errors[0].get("code") if errors else ""
        message = errors[0].get("message") if errors else "خطای درگاه"
        raise PaymentGatewayError(f"درگاه پرداخت: {message} ({code})")

    authority = (data.get("data") or {}).get("authority")
    if not authority:
        raise PaymentGatewayError("پاسخ نامعتبر از درگاه پرداخت.")

    return PaymentStartResult(
        authority=authority,
        payment_url=f"{_start_pay_base()}/{authority}",
    )


def verify_payment(*, amount_toman: int, authority: str) -> str:
    if authority.startswith("MOCK-"):
        return authority

    merchant_id = _merchant_id()
    payload = {
        "merchant_id": merchant_id,
        "amount": _tomans_to_rials(amount_toman),
        "authority": authority,
    }

    data = _post_json(f"{_api_base()}/verify.json", payload)
    errors = data.get("errors")
    if errors:
        code = errors[0].get("code") if errors else ""
        message = errors[0].get("message") if errors else "تایید پرداخت ناموفق"
        raise PaymentGatewayError(f"{message} ({code})")

    ref_id = (data.get("data") or {}).get("ref_id")
    if not ref_id:
        raise PaymentGatewayError("کد پیگیری درگاه دریافت نشد.")
    return str(ref_id)


def initiate_wallet_top_up(tx: WalletTransaction, http_request) -> PaymentStartResult:
    user = tx.wallet.user
    return initiate_payment(
        amount_toman=tx.amount,
        description=f"شارژ کیف پول — {tx.reference_code}",
        callback_view_name="api-wallet-top-up-callback",
        http_request=http_request,
        metadata={
            "mobile": getattr(user, "phone_number", "") or "",
            "email": getattr(user, "email", "") or "",
        },
    )


def verify_wallet_top_up(tx: WalletTransaction) -> str:
    ref_id = verify_payment(amount_toman=tx.amount, authority=tx.authority)
    if ref_id.startswith("MOCK-"):
        return tx.reference_code or f"MOCK-{tx.id}"
    return ref_id


def initiate_course_purchase(purchase, http_request) -> PaymentStartResult:
    user = purchase.user
    return initiate_payment(
        amount_toman=purchase.amount,
        description=f"خرید دوره — {purchase.course.title}",
        callback_view_name="api-course-purchase-callback",
        http_request=http_request,
        metadata={
            "mobile": getattr(user, "phone_number", "") or "",
            "email": getattr(user, "email", "") or "",
        },
    )


def verify_course_purchase(purchase) -> str:
    ref_id = verify_payment(amount_toman=purchase.amount, authority=purchase.authority)
    if ref_id.startswith("MOCK-"):
        return purchase.reference_code or f"MOCK-{purchase.id}"
    return ref_id


def initiate_order_payment(order, http_request) -> PaymentStartResult:
    user = order.user
    return initiate_payment(
        amount_toman=order.total_price,
        description=f"سفارش #{order.id}",
        callback_view_name="api-order-payment-callback",
        http_request=http_request,
        metadata={
            "mobile": getattr(user, "phone_number", "") or "",
            "email": getattr(user, "email", "") or "",
            "order_id": str(order.id),
        },
    )


def verify_order_payment(order) -> str:
    ref_id = verify_payment(amount_toman=order.total_price, authority=order.authority or "")
    if ref_id.startswith("MOCK-"):
        return f"MOCK-{order.id}"
    return ref_id
