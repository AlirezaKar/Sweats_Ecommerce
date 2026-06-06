import uuid

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views import View
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from app_payment.gateway import PaymentGatewayError, initiate_wallet_top_up, verify_wallet_top_up
from app_payment.models import Wallet, WalletTransaction
from app_payment.serializers import (
    WalletSerializer,
    WalletTopUpSerializer,
    WalletTransactionSerializer,
)
from config.utils.frontend import build_frontend_url, origin_from_request, store_payment_return_origin


class WalletDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = Wallet.get_or_create_for_user(request.user)
        return Response(WalletSerializer(wallet).data)


class WalletTransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletTransactionSerializer
    pagination_class = None

    def get_queryset(self):
        wallet = Wallet.get_or_create_for_user(self.request.user)
        return wallet.transactions.all()


class WalletTopUpView(APIView):
    """
    Start online wallet top-up: creates a pending transaction and returns
    payment_url so the client can redirect the user to the bank/gateway page.
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = WalletTopUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("confirm_immediately"):
            if not settings.DEBUG:
                return Response(
                    {"detail": _("شارژ آنی فقط در محیط توسعه مجاز است.")},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            wallet = Wallet.get_or_create_for_user(request.user)
            ref = f"TU-{uuid.uuid4().hex[:12].upper()}"
            tx = wallet.credit(
                data["amount"],
                WalletTransaction.TxType.TOP_UP,
                description="شارژ کیف پول (آنی — آزمایشی)",
            )
            tx.reference_code = ref
            tx.save(update_fields=["reference_code"])
            return Response(
                {
                    "transaction": WalletTransactionSerializer(tx).data,
                    "payment_url": None,
                },
                status=status.HTTP_201_CREATED,
            )

        wallet = Wallet.get_or_create_for_user(request.user)
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
        ref = f"TU-{uuid.uuid4().hex[:12].upper()}"
        tx = WalletTransaction.objects.create(
            wallet=wallet,
            tx_type=WalletTransaction.TxType.TOP_UP,
            amount=data["amount"],
            balance_after=wallet.balance,
            status=WalletTransaction.Status.PENDING,
            description="شارژ کیف پول — در انتظار پرداخت آنلاین",
            reference_code=ref,
        )

        try:
            payment = initiate_wallet_top_up(tx, request)
        except PaymentGatewayError as exc:
            tx.status = WalletTransaction.Status.FAILED
            tx.description = str(exc)[:255]
            tx.save(update_fields=["status", "description"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        tx.authority = payment.authority
        tx.save(update_fields=["authority"])

        return_origin = origin_from_request(request)
        if return_origin:
            store_payment_return_origin(payment.authority, return_origin)

        return Response(
            {
                "transaction": WalletTransactionSerializer(tx).data,
                "payment_url": payment.payment_url,
            },
            status=status.HTTP_201_CREATED,
        )


class WalletTopUpCallbackView(View):
    """Browser redirect from payment gateway after user pays or cancels."""

    def get(self, request):
        authority = request.GET.get("Authority", "")
        status_param = request.GET.get("Status", "")

        if not authority:
            return redirect(build_frontend_url("/wallet", payment="invalid"))

        try:
            with transaction.atomic():
                tx = (
                    WalletTransaction.objects.select_for_update()
                    .select_related("wallet")
                    .get(
                        authority=authority,
                        tx_type=WalletTransaction.TxType.TOP_UP,
                    )
                )

                if tx.status == WalletTransaction.Status.COMPLETED:
                    ref = tx.reference_code
                elif status_param != "OK":
                    if tx.status == WalletTransaction.Status.PENDING:
                        tx.reject_pending_top_up(target_status=WalletTransaction.Status.CANCELED)
                    return redirect(build_frontend_url("/wallet", authority=authority, payment="canceled"))
                else:
                    try:
                        ref_id = verify_wallet_top_up(tx)
                    except PaymentGatewayError:
                        if tx.status == WalletTransaction.Status.PENDING:
                            tx.reject_pending_top_up(target_status=WalletTransaction.Status.FAILED)
                        return redirect(build_frontend_url("/wallet", authority=authority, payment="failed"))

                    tx.refresh_from_db()
                    if tx.status == WalletTransaction.Status.PENDING:
                        tx.approve_pending_top_up()
                        tx.reference_code = ref_id
                        tx.description = "شارژ کیف پول — پرداخت آنلاین موفق"
                        tx.save(update_fields=["reference_code", "description"])
                    ref = ref_id
        except WalletTransaction.DoesNotExist:
            return redirect(build_frontend_url("/wallet", payment="invalid"))

        return redirect(build_frontend_url("/wallet", authority=authority, payment="success", ref=ref))


class WalletTopUpMockPayView(View):
    """Dev-only fake bank page when PAYMENT_GATEWAY_MOCK is enabled."""

    def get(self, request):
        if not (settings.DEBUG and getattr(settings, "PAYMENT_GATEWAY_MOCK", False)):
            return HttpResponse("Not found", status=404)

        authority = request.GET.get("authority", "")
        if not authority:
            return HttpResponse("authority required", status=400)

        callback = request.GET.get("callback", "").strip()
        if not callback:
            callback = request.build_absolute_uri(reverse("api-wallet-top-up-callback"))
        ok_url = f"{callback}?Authority={authority}&Status=OK"
        cancel_url = f"{callback}?Authority={authority}&Status=NOK"

        html = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><title>درگاه آزمایشی</title></head>
<body style="font-family:tahoma;max-width:420px;margin:3rem auto;padding:1.5rem;">
<h1>درگاه پرداخت آزمایشی</h1>
<p>این صفحه فقط برای توسعه است و جایگزین صفحه بانک/زرین‌پال می‌شود.</p>
<p><a href="{ok_url}" style="display:inline-block;padding:.75rem 1.25rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;">پرداخت موفق</a></p>
<p style="margin-top:1rem;"><a href="{cancel_url}">انصراف از پرداخت</a></p>
</body></html>"""
        return HttpResponse(html)


class WalletPayOrderView(APIView):
    """Pay an order from wallet balance."""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        from app_order.models import Order

        try:
            order = Order.objects.select_for_update().get(
                pk=order_id,
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response({"detail": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if order.is_paid:
            return Response({"detail": "این سفارش قبلاً پرداخت شده است."}, status=status.HTTP_400_BAD_REQUEST)

        wallet = Wallet.get_or_create_for_user(request.user)
        try:
            tx = wallet.debit(
                order.total_price,
                WalletTransaction.TxType.PURCHASE,
                description=f"پرداخت سفارش #{order.id}",
                order=order,
            )
        except Exception as exc:
            from app_payment.models import InsufficientWalletBalance

            if isinstance(exc, InsufficientWalletBalance):
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            raise

        order.is_paid = True
        order.status = Order.Status.PROCESSING
        order.save(update_fields=["is_paid", "status"])

        return Response(
            {
                "order_id": order.id,
                "paid": True,
                "transaction": WalletTransactionSerializer(tx).data,
                "wallet": WalletSerializer(wallet).data,
            }
        )
