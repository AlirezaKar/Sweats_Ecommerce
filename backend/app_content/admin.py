from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _

from app_content.models import (
    BlogComment,
    BlogPost,
    Course,
    CourseEnrollment,
    CourseEpisode,
    CourseFile,
    CoursePurchase,
    CourseReview,
    Tutorial,
)


class CourseFileInline(admin.TabularInline):
    model = CourseFile
    extra = 1
    fields = ("title", "file", "order", "is_active")
    ordering = ("order",)


class CourseEpisodeInline(admin.TabularInline):
    model = CourseEpisode
    extra = 1
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("order",)


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "published_at")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "slug")


@admin.action(description=_("تایید نظرات انتخاب‌شده"))
def approve_blog_comments(modeladmin, request, queryset):
    updated = queryset.update(is_approved=True)
    if updated:
        messages.success(request, _("%(count)s نظر تایید شد.") % {"count": updated})


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "parent", "is_approved", "created_at", "text_preview")
    list_filter = ("is_approved",)
    search_fields = ("post__title", "user__username", "text")
    actions = [approve_blog_comments]
    list_editable = ("is_approved",)

    @admin.display(description=_("متن"))
    def text_preview(self, obj: BlogComment) -> str:
        return obj.text[:60] + ("…" if len(obj.text) > 60 else "")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "instructor_name", "level", "is_free", "price", "is_published")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("is_free", "level", "is_published")
    search_fields = ("title", "slug", "instructor_name")
    inlines = [CourseEpisodeInline, CourseFileInline]


@admin.register(CourseFile)
class CourseFileAdmin(admin.ModelAdmin):
    list_display = ("course", "title", "original_filename", "order", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("course__title", "title", "original_filename")


@admin.register(CourseEpisode)
class CourseEpisodeAdmin(admin.ModelAdmin):
    list_display = ("course", "title", "slug", "order", "duration_minutes", "is_preview")
    list_filter = ("is_preview",)
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("course__title", "title")


@admin.action(description=_("تایید نظرات دوره انتخاب‌شده"))
def approve_course_reviews(modeladmin, request, queryset):
    updated = queryset.update(is_approved=True)
    if updated:
        messages.success(request, _("%(count)s نظر تایید شد.") % {"count": updated})


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ("course", "user", "rating", "is_approved", "created_at", "text_preview")
    list_filter = ("is_approved", "rating")
    search_fields = ("course__title", "user__username", "text")
    actions = [approve_course_reviews]
    list_editable = ("is_approved",)

    @admin.display(description=_("متن"))
    def text_preview(self, obj: CourseReview) -> str:
        return obj.text[:60] + ("…" if len(obj.text) > 60 else "")


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "price_paid", "enrolled_at")
    list_filter = ("enrolled_at",)
    search_fields = ("user__username", "course__title")


@admin.register(CoursePurchase)
class CoursePurchaseAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "amount", "status", "reference_code", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__username", "course__title", "authority", "reference_code")
    readonly_fields = ("user", "course", "amount", "authority", "reference_code", "enrollment", "created_at", "updated_at")


@admin.register(Tutorial)
class TutorialAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "duration_minutes", "is_published")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("is_published",)
