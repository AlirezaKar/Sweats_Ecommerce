from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from config.utils.images import convert_model_image_fields


def blog_thumbnail_upload_to(instance, filename: str) -> str:
    folder = instance.slug if getattr(instance, "slug", None) else "new"
    return f"content/blog/{folder}/{filename}"


def tutorial_thumbnail_upload_to(instance, filename: str) -> str:
    folder = instance.slug if getattr(instance, "slug", None) else "new"
    return f"content/tutorials/{folder}/{filename}"


def course_thumbnail_upload_to(instance, filename: str) -> str:
    folder = instance.slug if getattr(instance, "slug", None) else "new"
    return f"content/courses/{folder}/{filename}"


def course_file_upload_to(instance, filename: str) -> str:
    course_id = instance.course_id or "new"
    return f"content/courses/{course_id}/files/{filename}"


class BlogPost(models.Model):
    title = models.CharField(_("عنوان"), max_length=255)
    slug = models.SlugField(_("نامک"), max_length=280, unique=True, allow_unicode=True)
    excerpt = models.TextField(_("خلاصه"), blank=True)
    body = models.TextField(_("متن"))
    thumbnail = models.ImageField(
        _("تصویر شاخص"),
        upload_to=blog_thumbnail_upload_to,
        null=True,
        blank=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("نویسنده"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_posts",
    )
    is_published = models.BooleanField(_("منتشر شده"), default=True)
    published_at = models.DateTimeField(_("تاریخ انتشار"), auto_now_add=True)
    updated_at = models.DateTimeField(_("به‌روزرسانی"), auto_now=True)

    class Meta:
        verbose_name = _("مقاله")
        verbose_name_plural = _("مقالات")
        ordering = ["-published_at"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        updated = convert_model_image_fields(self, "thumbnail")
        if updated:
            super().save(update_fields=updated)


class BlogComment(models.Model):
    post = models.ForeignKey(
        BlogPost,
        verbose_name=_("مقاله"),
        on_delete=models.CASCADE,
        related_name="comments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="blog_comments",
    )
    parent = models.ForeignKey(
        "self",
        verbose_name=_("پاسخ به"),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    text = models.TextField(_("متن"))
    is_approved = models.BooleanField(
        _("تایید شده"),
        default=False,
        help_text=_("نظر پس از تایید در سایت نمایش داده می‌شود"),
    )
    created_at = models.DateTimeField(_("تاریخ"), auto_now_add=True)

    class Meta:
        verbose_name = _("نظر بلاگ")
        verbose_name_plural = _("نظرات بلاگ")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"نظر روی {self.post.title}"


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = "beginner", _("مبتدی")
        INTERMEDIATE = "intermediate", _("متوسط")
        ADVANCED = "advanced", _("پیشرفته")

    title = models.CharField(_("عنوان دوره"), max_length=255)
    slug = models.SlugField(_("نامک"), max_length=280, unique=True, allow_unicode=True)
    description = models.TextField(_("توضیحات"))
    instructor_name = models.CharField(_("مدرس"), max_length=120, default="تیم آموزش")
    thumbnail = models.ImageField(
        _("تصویر"),
        upload_to=course_thumbnail_upload_to,
        null=True,
        blank=True,
    )
    level = models.CharField(_("سطح"), max_length=20, choices=Level.choices, default=Level.BEGINNER)
    is_free = models.BooleanField(_("رایگان"), default=False)
    price = models.PositiveIntegerField(_("قیمت (تومان)"), null=True, blank=True)
    is_published = models.BooleanField(_("منتشر شده"), default=True)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("دوره")
        verbose_name_plural = _("دوره‌ها")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        updated = convert_model_image_fields(self, "thumbnail")
        if updated:
            super().save(update_fields=updated)


class CourseFile(models.Model):
    """فایل‌های دوره (مواد اولیه، PDF، متن و …) — فقط برای ثبت‌نام‌شده‌ها."""

    course = models.ForeignKey(
        Course,
        verbose_name=_("دوره"),
        on_delete=models.CASCADE,
        related_name="files",
    )
    title = models.CharField(_("عنوان"), max_length=200)
    file = models.FileField(_("فایل"), upload_to=course_file_upload_to)
    original_filename = models.CharField(_("نام فایل"), max_length=255, blank=True)
    order = models.PositiveIntegerField(_("ترتیب"), default=0)
    is_active = models.BooleanField(_("فعال"), default=True)
    created_at = models.DateTimeField(_("تاریخ آپلود"), auto_now_add=True)

    class Meta:
        verbose_name = _("فایل دوره")
        verbose_name_plural = _("فایل‌های دوره")
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.course.title} — {self.title}"

    def save(self, *args, **kwargs):
        if self.file and not self.original_filename:
            self.original_filename = self.file.name.rsplit("/", 1)[-1]
        super().save(*args, **kwargs)


class CourseEpisode(models.Model):
    course = models.ForeignKey(
        Course,
        verbose_name=_("دوره"),
        on_delete=models.CASCADE,
        related_name="episodes",
    )
    title = models.CharField(_("عنوان جلسه"), max_length=255)
    slug = models.SlugField(_("نامک"), max_length=280, allow_unicode=True)
    order = models.PositiveIntegerField(_("ترتیب"), default=0)
    video_url = models.URLField(_("لینک ویدیو"))
    duration_minutes = models.PositiveIntegerField(_("مدت (دقیقه)"), default=10)
    is_preview = models.BooleanField(_("پیش‌نمایش رایگان"), default=False)
    description = models.TextField(_("توضیحات"), blank=True)

    class Meta:
        verbose_name = _("جلسه دوره")
        verbose_name_plural = _("جلسات دوره")
        ordering = ["order", "id"]
        unique_together = ("course", "slug")

    def __str__(self) -> str:
        return f"{self.course.title} — {self.title}"


class CourseReview(models.Model):
    class Rating(models.IntegerChoices):
        ONE = 1, _("۱ ستاره")
        TWO = 2, _("۲ ستاره")
        THREE = 3, _("۳ ستاره")
        FOUR = 4, _("۴ ستاره")
        FIVE = 5, _("۵ ستاره")

    course = models.ForeignKey(
        Course,
        verbose_name=_("دوره"),
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="course_reviews",
    )
    rating = models.PositiveSmallIntegerField(_("امتیاز"), choices=Rating.choices)
    text = models.TextField(_("نظر"))
    is_approved = models.BooleanField(
        _("تایید شده"),
        default=False,
        help_text=_("نظر پس از تایید در سایت نمایش داده می‌شود"),
    )
    created_at = models.DateTimeField(_("تاریخ"), auto_now_add=True)

    class Meta:
        verbose_name = _("نظر دوره")
        verbose_name_plural = _("نظرات دوره")
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["course", "user"], name="uniq_course_review_user"),
        ]

    def __str__(self) -> str:
        return f"نظر {self.user} — {self.course.title}"


class CourseEnrollment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="course_enrollments",
    )
    course = models.ForeignKey(
        Course,
        verbose_name=_("دوره"),
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    price_paid = models.PositiveIntegerField(_("مبلغ پرداخت‌شده (تومان)"), default=0)
    enrolled_at = models.DateTimeField(_("تاریخ ثبت"), auto_now_add=True)

    class Meta:
        verbose_name = _("ثبت‌نام دوره")
        verbose_name_plural = _("ثبت‌نام‌های دوره")
        ordering = ["-enrolled_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="uniq_course_enrollment_user"),
        ]

    def __str__(self) -> str:
        return f"{self.user} — {self.course.title}"


class CoursePurchase(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("در انتظار پرداخت")
        COMPLETED = "completed", _("تکمیل شده")
        FAILED = "failed", _("ناموفق")
        CANCELED = "canceled", _("لغو شده")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("کاربر"),
        on_delete=models.CASCADE,
        related_name="course_purchases",
    )
    course = models.ForeignKey(
        Course,
        verbose_name=_("دوره"),
        on_delete=models.CASCADE,
        related_name="purchases",
    )
    amount = models.PositiveIntegerField(_("مبلغ (تومان)"))
    authority = models.CharField(
        _("کد authority درگاه"),
        max_length=100,
        blank=True,
        db_index=True,
    )
    reference_code = models.CharField(_("کد پیگیری"), max_length=64, blank=True)
    status = models.CharField(
        _("وضعیت"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    enrollment = models.OneToOneField(
        CourseEnrollment,
        verbose_name=_("ثبت‌نام"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase",
    )
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)
    updated_at = models.DateTimeField(_("به‌روزرسانی"), auto_now=True)

    class Meta:
        verbose_name = _("خرید دوره")
        verbose_name_plural = _("خریدهای دوره")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} — {self.course.title} ({self.get_status_display()})"


class Tutorial(models.Model):
    title = models.CharField(_("عنوان"), max_length=255)
    slug = models.SlugField(_("نامک"), max_length=280, unique=True, allow_unicode=True)
    description = models.TextField(_("توضیحات"))
    thumbnail = models.ImageField(
        _("تصویر"),
        upload_to=tutorial_thumbnail_upload_to,
        null=True,
        blank=True,
    )
    video_url = models.URLField(
        _("لینک ویدیو"),
        help_text=_("آپارات، CDN یا فایل استاتیک"),
    )
    duration_minutes = models.PositiveIntegerField(_("مدت (دقیقه)"), default=10)
    is_published = models.BooleanField(_("منتشر شده"), default=True)
    created_at = models.DateTimeField(_("تاریخ ایجاد"), auto_now_add=True)

    class Meta:
        verbose_name = _("آموزش")
        verbose_name_plural = _("آموزش‌ها")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        updated = convert_model_image_fields(self, "thumbnail")
        if updated:
            super().save(update_fields=updated)
