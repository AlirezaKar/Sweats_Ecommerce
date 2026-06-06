from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _

from app_payment.models import Wallet, WalletTransaction


class WalletTransactionInline(admin.TabularInline):
    model = WalletTransaction
    extra = 0
    readonly_fields = (
        "tx_type",
        "amount",
        "balance_after",
        "status",
        "reference_code",
        "authority",
        "created_at",
    )
    can_delete = False


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "updated_at")
    search_fields = ("user__username", "user__phone_number")
    inlines = [WalletTransactionInline]


@admin.action(description=_("تایید شارژ انتخاب‌شده (واریز به موجودی)"))
def approve_top_ups(modeladmin, request, queryset):
    approved = 0
    for tx in queryset.select_related("wallet"):
        if tx.status != WalletTransaction.Status.PENDING:
            continue
        try:
            tx.approve_pending_top_up()
            approved += 1
        except ValueError as exc:
            modeladmin.message_user(request, str(exc), level=messages.ERROR)
    if approved:
        modeladmin.message_user(
            request,
            _("%(count)s درخواست شارژ تایید شد.") % {"count": approved},
            level=messages.SUCCESS,
        )


@admin.action(description=_("رد درخواست شارژ انتخاب‌شده"))
def reject_top_ups(modeladmin, request, queryset):
    rejected = 0
    for tx in queryset.select_related("wallet"):
        if tx.status != WalletTransaction.Status.PENDING:
            continue
        try:
            tx.reject_pending_top_up()
            rejected += 1
        except ValueError as exc:
            modeladmin.message_user(request, str(exc), level=messages.ERROR)
    if rejected:
        modeladmin.message_user(
            request,
            _("%(count)s درخواست رد شد.") % {"count": rejected},
            level=messages.WARNING,
        )


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "wallet",
        "tx_type",
        "amount",
        "balance_after",
        "status",
        "reference_code",
        "authority",
        "created_at",
    )
    list_filter = ("tx_type", "status")
    search_fields = ("wallet__user__username", "reference_code", "authority", "description")
    readonly_fields = ("balance_after", "created_at")
    actions = [approve_top_ups, reject_top_ups]

    def save_model(self, request, obj, form, change):
        if change and "status" in form.changed_data:
            tx = WalletTransaction.objects.get(pk=obj.pk)
            if tx.status != WalletTransaction.Status.PENDING:
                super().save_model(request, obj, form, change)
                return

            if obj.status == WalletTransaction.Status.COMPLETED:
                try:
                    tx.approve_pending_top_up()
                    messages.success(request, _("شارژ تایید و به موجودی اضافه شد."))
                    return
                except ValueError as exc:
                    messages.error(request, str(exc))
                    return

            if obj.status in (
                WalletTransaction.Status.FAILED,
                WalletTransaction.Status.CANCELED,
            ):
                try:
                    tx.reject_pending_top_up(target_status=obj.status)
                    messages.warning(request, _("درخواست شارژ رد شد."))
                    return
                except ValueError as exc:
                    messages.error(request, str(exc))
                    return

        super().save_model(request, obj, form, change)
