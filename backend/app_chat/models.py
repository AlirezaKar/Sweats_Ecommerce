from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class SupportThread(models.Model):
    class Source(models.TextChoices):
        WIDGET = "widget", _("ویجت پشتیبانی")
        CONTACT = "contact", _("فرم تماس")

    class Status(models.TextChoices):
        OPEN = "open", _("باز")
        CLOSED = "closed", _("بسته")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="support_threads",
        null=True,
        blank=True,
    )
    guest_name = models.CharField(_("نام"), max_length=120, blank=True)
    guest_email = models.EmailField(_("ایمیل"), blank=True)
    guest_phone = models.CharField(_("تلفن"), max_length=20, blank=True)
    subject = models.CharField(_("موضوع"), max_length=200, blank=True)
    source = models.CharField(
        _("منبع"),
        max_length=20,
        choices=Source.choices,
        default=Source.WIDGET,
    )
    status = models.CharField(
        _("وضعیت"),
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )
    staff_unread_count = models.PositiveIntegerField(_("پیام‌های خوانده‌نشده"), default=0)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)
    updated_at = models.DateTimeField(_("آخرین فعالیت"), auto_now=True)

    class Meta:
        verbose_name = _("گفتگوی پشتیبانی")
        verbose_name_plural = _("گفتگوهای پشتیبانی")
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(user__isnull=False, source="widget"),
                name="unique_widget_thread_per_user",
            )
        ]

    def __str__(self) -> str:
        label = self.display_name
        if self.subject:
            return f"{label} — {self.subject}"
        return label

    @property
    def display_name(self) -> str:
        if self.user_id:
            name = self.user.get_full_name().strip()
            return name or self.user.username
        return self.guest_name or self.guest_email or _("مهمان")

    @property
    def last_message_preview(self) -> str:
        msg = self.messages.order_by("-created_at").first()
        if not msg:
            return ""
        text = msg.body.strip()
        return text[:80] + ("…" if len(text) > 80 else "")


class SupportMessage(models.Model):
    thread = models.ForeignKey(
        SupportThread,
        verbose_name=_("گفتگو"),
        on_delete=models.CASCADE,
        related_name="messages",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("نویسنده"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_messages",
    )
    is_staff = models.BooleanField(_("پاسخ پشتیبانی"), default=False)
    body = models.TextField(_("متن پیام"))
    created_at = models.DateTimeField(_("تاریخ"), auto_now_add=True)

    class Meta:
        verbose_name = _("پیام پشتیبانی")
        verbose_name_plural = _("پیام‌های پشتیبانی")
        ordering = ["created_at"]

    def __str__(self) -> str:
        role = _("پشتیبانی") if self.is_staff else _("کاربر")
        preview = self.body.strip()[:50]
        return f"{role}: {preview}"
