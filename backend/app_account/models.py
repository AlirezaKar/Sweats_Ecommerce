from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError(_("نام کاربری الزامی است."))
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user. Admin login: username + password.
    Future: username or phone_number + password.
    """

    phone_number = models.CharField(
        _("شماره موبایل"),
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        help_text=_("اختیاری — برای OTP و ورود با موبایل در آینده"),
    )
    email = models.EmailField(
        _("ایمیل"),
        null=True,
        blank=True,
        help_text=_("برای اعلان‌ها و بازیابی حساب"),
    )
    national_id = models.CharField(
        _("کد ملی"),
        max_length=10,
        null=True,
        blank=True,
        unique=True,
    )

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        verbose_name = _("کاربر")
        verbose_name_plural = _("کاربران")

    def __str__(self) -> str:
        name = self.get_full_name().strip()
        return name or self.username

    def __repr__(self) -> str:
        return self.username


class Address(models.Model):
    """Shipping address linked directly to the user."""

    user = models.ForeignKey(
        User,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    title = models.CharField(
        _("عنوان آدرس"),
        max_length=50,
        help_text=_("مثلاً: خانه، محل کار"),
    )
    province = models.CharField(_("استان"), max_length=50)
    city = models.CharField(_("شهر"), max_length=50)
    postal_address = models.TextField(_("آدرس دقیق پستی"))
    postal_code = models.CharField(_("کد پستی"), max_length=10)
    receiver_name = models.CharField(_("نام گیرنده"), max_length=100)
    receiver_phone = models.CharField(_("شماره گیرنده"), max_length=11)
    is_default = models.BooleanField(_("آدرس پیش‌فرض"), default=False)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("آدرس")
        verbose_name_plural = _("آدرس‌ها")
        ordering = ["-is_default", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title} — {self.city}، {self.province}"

    def __repr__(self) -> str:
        return f"{self.title} ({self.user_id})"

    def clean(self):
        super().clean()
        if self.receiver_phone and len(self.receiver_phone) != 11:
            raise ValidationError(
                {"receiver_phone": _("شماره گیرنده باید ۱۱ رقم باشد.")}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(
                pk=self.pk
            ).update(is_default=False)
