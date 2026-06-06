from django.conf import settings
from django.db import models, transaction
from django.utils.translation import gettext_lazy as _


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.PositiveIntegerField(_("موجودی (تومان)"), default=0)
    updated_at = models.DateTimeField(_("به\u200cروزرسانی"), auto_now=True)

    class Meta:
        verbose_name = _("کیف پول")
        verbose_name_plural = _("کیف\u200cپول\u200cها")

    def __str__(self) -> str:
        return f"کیف پول {self.user} — {self.balance:,} تومان"

    @classmethod
    def get_or_create_for_user(cls, user):
        wallet, _ = cls.objects.get_or_create(user=user)
        return wallet

    @transaction.atomic
    def credit(self, amount: int, tx_type: str, description: str = "", order=None) -> "WalletTransaction":
        if amount <= 0:
            raise ValueError("amount must be positive")
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        wallet.balance += amount
        wallet.save(update_fields=["balance", "updated_at"])
        return WalletTransaction.objects.create(
            wallet=wallet,
            tx_type=tx_type,
            amount=amount,
            balance_after=wallet.balance,
            status=WalletTransaction.Status.COMPLETED,
            description=description,
            order=order,
        )

    @transaction.atomic
    def debit(self, amount: int, tx_type: str, description: str = "", order=None) -> "WalletTransaction":
        if amount <= 0:
            raise ValueError("amount must be positive")
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        if wallet.balance < amount:
            raise InsufficientWalletBalance(
                _("موجودی کیف پول کافی نیست.")
            )
        wallet.balance -= amount
        wallet.save(update_fields=["balance", "updated_at"])
        return WalletTransaction.objects.create(
            wallet=wallet,
            tx_type=tx_type,
            amount=-amount,
            balance_after=wallet.balance,
            status=WalletTransaction.Status.COMPLETED,
            description=description,
            order=order,
        )


class InsufficientWalletBalance(Exception):
    pass


class WalletTransaction(models.Model):
    class TxType(models.TextChoices):
        TOP_UP = "top_up", _("شارژ کیف پول")
        PURCHASE = "purchase", _("خرید")
        REFUND = "refund", _("بازگشت وجه")
        ADJUSTMENT = "adjustment", _("تعدیل")

    class Status(models.TextChoices):
        PENDING = "pending", _("در انتظار")
        COMPLETED = "completed", _("تکمیل شده")
        FAILED = "failed", _("ناموفق")
        CANCELED = "canceled", _("لغو شده")

    wallet = models.ForeignKey(
        Wallet,
        verbose_name=_("کیف پول"),
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    tx_type = models.CharField(_("نوع"), max_length=20, choices=TxType.choices)
    amount = models.IntegerField(
        _("مبلغ (تومان)"),
        help_text=_("مثبت = واریز، منفی = برداشت"),
    )
    balance_after = models.PositiveIntegerField(_("موجودی پس از تراکنش"))
    status = models.CharField(
        _("وضعیت"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    description = models.CharField(_("توضیح"), max_length=255, blank=True)
    reference_code = models.CharField(
        _("کد پیگیری"),
        max_length=64,
        blank=True,
        help_text=_("کد پیگیری درگاه پس از پرداخت موفق"),
    )
    authority = models.CharField(
        _("کد authority درگاه"),
        max_length=100,
        blank=True,
        db_index=True,
        help_text=_("شناسه جلسه پرداخت آنلاین (مثلاً زرین‌پال)"),
    )
    order = models.ForeignKey(
        "app_order.Order",
        verbose_name=_("سفارش"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wallet_transactions",
    )
    created_at = models.DateTimeField(_("تاریخ"), auto_now_add=True)

    class Meta:
        verbose_name = _("تراکنش کیف پول")
        verbose_name_plural = _("تراکنش\u200cهای کیف پول")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_tx_type_display()} {self.amount:+,} — {self.wallet.user}"

    @transaction.atomic
    def approve_pending_top_up(self) -> None:
        """Staff confirms a bank transfer — credits wallet balance."""
        if self.status != self.Status.PENDING:
            raise ValueError(_("فقط تراکنش‌های در انتظار قابل تایید هستند."))
        if self.tx_type != self.TxType.TOP_UP or self.amount <= 0:
            raise ValueError(_("فقط درخواست‌های شارژ مثبت قابل تایید هستند."))

        wallet = Wallet.objects.select_for_update().get(pk=self.wallet_id)
        wallet.balance += self.amount
        wallet.save(update_fields=["balance", "updated_at"])

        self.status = self.Status.COMPLETED
        self.balance_after = wallet.balance
        if not self.description or "منتظر تایید" in self.description:
            self.description = "شارژ کیف پول — تایید شد"
        self.save(update_fields=["status", "balance_after", "description"])

    @transaction.atomic
    def reject_pending_top_up(self, *, target_status: str | None = None) -> None:
        if self.status != self.Status.PENDING:
            raise ValueError(_("فقط تراکنش‌های در انتظار قابل رد هستند."))
        if self.tx_type != self.TxType.TOP_UP:
            raise ValueError(_("فقط درخواست‌های شارژ قابل رد هستند."))

        status = target_status or self.Status.FAILED
        if status not in (self.Status.FAILED, self.Status.CANCELED):
            status = self.Status.FAILED

        self.status = status
        if not self.description or "منتظر تایید" in self.description:
            self.description = "درخواست شارژ رد شد"
        self.save(update_fields=["status", "description"])
