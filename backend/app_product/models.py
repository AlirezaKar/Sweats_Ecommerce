from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from config.utils.images import convert_model_image_fields


def category_image_upload_to(instance, filename: str) -> str:
    folder = instance.slug if getattr(instance, "slug", None) else "new"
    return f"products/_category/image/{folder}/{filename}"


def category_icon_upload_to(instance, filename: str) -> str:
    folder = instance.slug if getattr(instance, "slug", None) else "new"
    return f"products/_category/icon/{folder}/{filename}"


def product_image_upload_to(instance, filename: str) -> str:
    product_id = instance.product_id or "new"
    return f"products/{product_id}/{filename}"


def product_feature_image_upload_to(instance, filename: str) -> str:
    """Kept for historical migrations (ProductFeatureBlock removed)."""
    product_id = instance.product_id or "new"
    return f"products/features/{product_id}/{filename}"


def product_feature_video_upload_to(instance, filename: str) -> str:
    """Kept for historical migrations (ProductFeatureBlock removed)."""
    product_id = instance.product_id or "new"
    return f"products/features/{product_id}/videos/{filename}"


class Category(models.Model):
    name = models.CharField(_("نام دسته‌بندی"), max_length=100)
    slug = models.SlugField(_("نامک (آدرس)"), max_length=120, unique=True, allow_unicode=True)
    description = models.TextField(_("توضیحات"), null=True, blank=True)
    parent = models.ForeignKey(
        "self",
        verbose_name=_("دسته والد"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    image = models.ImageField(
        _("تصویر دسته‌بندی"),
        upload_to=category_image_upload_to,
        null=True,
        blank=True,
    )
    icon = models.FileField(
        _("آیکون"),
        upload_to=category_icon_upload_to,
        null=True,
        blank=True,
        help_text=_("فقط SVG — بدون تبدیل به WebP"),
    )
    order = models.IntegerField(_("ترتیب نمایش"), default=0)
    is_active = models.BooleanField(_("فعال"), default=True)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)
    updated_at = models.DateTimeField(_("تاریخ به‌روزرسانی"), auto_now=True)

    class Meta:
        verbose_name = _("دسته‌بندی")
        verbose_name_plural = _("دسته‌بندی‌ها")
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return f"{self.name} : {self.parent}"

    def __repr__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        updated = convert_model_image_fields(self, "image")
        if updated:
            super().save(update_fields=updated)


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        verbose_name=_("دسته‌بندی"),
        on_delete=models.PROTECT,
        related_name="products",
    )
    title = models.CharField(_("عنوان محصول"), max_length=255)
    en_title = models.CharField(_("عنوان انگلیسی"), max_length=255, null=True, blank=True)
    slug = models.SlugField(_("نامک (آدرس)"), max_length=280, unique=True, allow_unicode=True)
    description = models.TextField(_("توضیحات"))
    detailed_description = models.TextField(
        _("توضیحات تکمیلی"),
        blank=True,
        help_text=_("متن آزاد برای جزئیات بیشتر محصول — در صفحه محصول نمایش داده می‌شود."),
    )

    price = models.PositiveIntegerField(_("قیمت (تومان)"))
    discounted_price = models.PositiveIntegerField(_("قیمت با تخفیف (تومان)"), null=True, blank=True)
    stock = models.PositiveIntegerField(_("موجودی"), default=0)

    is_active = models.BooleanField(_("فعال"), default=True)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("محصول")
        verbose_name_plural = _("محصولات")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} : {self.category} : {self.price} | {self.stock}"

    def __repr__(self) -> str:
        return self.title

    @property
    def final_price(self) -> int:
        return self.discounted_price if self.discounted_price else self.price

    @property
    def is_on_sale(self) -> bool:
        return self.discounted_price is not None and self.discounted_price < self.price

    def clean(self):
        super().clean()
        if self.discounted_price is not None and self.discounted_price >= self.price:
            raise ValidationError(
                {"discounted_price": _("قیمت با تخفیف باید کمتر از قیمت اصلی باشد.")}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        verbose_name=_("محصول"),
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(_("تصویر"), upload_to=product_image_upload_to)
    alt_text = models.CharField(_("متن جایگزین (alt)"), max_length=255, null=True, blank=True)
    order = models.IntegerField(_("ترتیب نمایش"), default=0)
    is_main = models.BooleanField(_("تصویر اصلی"), default=False)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("تصویر محصول")
        verbose_name_plural = _("تصاویر محصول")
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.product} : {self.alt_text}"

    def __repr__(self) -> str:
        return self.alt_text or str(self.pk)

    def clean(self):
        super().clean()
        if not self.is_main or not self.product_id:
            return
        qs = ProductImage.objects.filter(product_id=self.product_id, is_main=True)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        if qs.exists():
            raise ValidationError(
                {"is_main": _("هر محصول فقط یک تصویر اصلی می‌تواند داشته باشد.")}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        updated = convert_model_image_fields(self, "image")
        if updated:
            super().save(update_fields=updated)


class Comment(models.Model):
    class Rating(models.IntegerChoices):
        ONE = 1, _("۱ ستاره")
        TWO = 2, _("۲ ستاره")
        THREE = 3, _("۳ ستاره")
        FOUR = 4, _("۴ ستاره")
        FIVE = 5, _("۵ ستاره")

    product = models.ForeignKey(
        Product,
        verbose_name=_("محصول"),
        on_delete=models.CASCADE,
        related_name="comments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="product_comments",
    )
    parent = models.ForeignKey(
        "self",
        verbose_name=_("پاسخ به"),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    title = models.CharField(_("عنوان نظر"), max_length=100, null=True, blank=True)
    text = models.TextField(_("متن نظر"))
    rating = models.PositiveSmallIntegerField(
        _("امتیاز"),
        choices=Rating.choices,
        default=Rating.FIVE,
    )
    is_approved = models.BooleanField(
        _("تایید شده"),
        default=False,
        help_text=_("نظر پس از تایید در سایت نمایش داده می‌شود"),
    )
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("نظر")
        verbose_name_plural = _("نظرات")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"نظر {self.user} روی {self.product.title}"

    def __repr__(self) -> str:
        return f"Comment({self.pk})"

    @property
    def is_verified_buyer(self) -> bool:
        """آیا کاربر این محصول را خریده و پرداخت کرده است؟"""
        from app_order.models import OrderItem

        return OrderItem.objects.filter(
            order__user=self.user,
            order__is_paid=True,
            product=self.product,
        ).exists()
