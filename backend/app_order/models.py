from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)
    updated_at = models.DateTimeField(_("تاریخ به‌روزرسانی"), auto_now=True)

    class Meta:
        verbose_name = _("سبد خرید")
        verbose_name_plural = _("سبدهای خرید")

    def __str__(self) -> str:
        return f"سبد خرید: {self.user}"

    def __repr__(self) -> str:
        return f"Cart({self.user_id})"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        verbose_name=_("سبد خرید"),
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "app_product.Product",
        verbose_name=_("محصول"),
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(_("تعداد"), default=1)

    class Meta:
        verbose_name = _("آیتم سبد خرید")
        verbose_name_plural = _("آیتم‌های سبد خرید")
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"],
                name="uniq_cart_product",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} × {self.product.title}"

    def __repr__(self) -> str:
        return f"CartItem({self.cart_id}, {self.product_id})"

    @property
    def line_total(self) -> int:
        return self.product.final_price * self.quantity


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("در انتظار پرداخت")
        PROCESSING = "processing", _("در حال پردازش")
        SHIPPED = "shipped", _("ارسال شده")
        CANCELED = "canceled", _("لغو شده")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.PROTECT,
        related_name="orders",
    )
    address = models.ForeignKey(
        "app_account.Address",
        verbose_name=_("آدرس"),
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        _("وضعیت"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    total_price = models.PositiveIntegerField(_("مبلغ کل (تومان)"))
    tracking_code = models.CharField(
        _("کد رهگیری پستی"),
        max_length=100,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    authority = models.CharField(
        _("کد authority درگاه"),
        max_length=100,
        null=True,
        blank=True,
        help_text=_("برای پرداخت آنلاین (مثلاً زرین‌پال) — اختیاری"),
    )
    is_paid = models.BooleanField(_("پرداخت شده"), default=False)

    class Meta:
        verbose_name = _("سفارش")
        verbose_name_plural = _("سفارش‌ها")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"سفارش {self.id} — {self.user}"

    def __repr__(self) -> str:
        return f"Order({self.id})"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        verbose_name=_("سفارش"),
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "app_product.Product",
        verbose_name=_("محصول"),
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    price = models.PositiveIntegerField(
        _("قیمت (تومان)"),
        help_text=_("قیمت در لحظه خرید"),
    )
    quantity = models.PositiveIntegerField(_("تعداد"))

    class Meta:
        verbose_name = _("آیتم سفارش")
        verbose_name_plural = _("آیتم‌های سفارش")

    def __str__(self) -> str:
        return f"{self.quantity} × {self.product.title} (سفارش {self.order_id})"

    def __repr__(self) -> str:
        return f"OrderItem({self.order_id}, {self.product_id})"

    @property
    def line_total(self) -> int:
        return self.price * self.quantity
