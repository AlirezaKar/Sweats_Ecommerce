from django.contrib import admin, messages
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from app_chat.models import SupportMessage, SupportThread


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    fields = ("body", "is_staff", "author", "created_at")
    readonly_fields = ("body", "is_staff", "author", "created_at")
    can_delete = False
    ordering = ("created_at",)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SupportThread)
class SupportThreadAdmin(admin.ModelAdmin):
    change_form_template = "admin/app_chat/supportthread/change_form.html"
    list_display = (
        "sender_label",
        "subject",
        "source",
        "status",
        "staff_unread_count",
        "updated_at",
        "last_message_preview_col",
    )
    list_filter = ("source", "status", "staff_unread_count")
    search_fields = (
        "guest_name",
        "guest_email",
        "guest_phone",
        "subject",
        "user__username",
        "user__first_name",
        "user__last_name",
    )
    readonly_fields = (
        "display_name",
        "guest_name",
        "guest_email",
        "guest_phone",
        "user",
        "source",
        "created_at",
        "updated_at",
        "last_message_preview_col",
    )
    list_editable = ("status",)
    inlines = [SupportMessageInline]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "display_name",
                    "user",
                    "guest_name",
                    "guest_email",
                    "guest_phone",
                    "subject",
                    "source",
                    "status",
                    "staff_unread_count",
                    "created_at",
                    "updated_at",
                    "last_message_preview_col",
                )
            },
        ),
    )

    @admin.display(description=_("فرستنده"))
    def sender_label(self, obj: SupportThread) -> str:
        return obj.display_name

    @admin.display(description=_("آخرین پیام"))
    def last_message_preview_col(self, obj: SupportThread) -> str:
        return obj.last_message_preview

    def change_view(self, request, object_id, form_url="", extra_context=None):
        if object_id:
            SupportThread.objects.filter(pk=object_id, staff_unread_count__gt=0).update(
                staff_unread_count=0
            )
        extra_context = extra_context or {}
        return super().change_view(request, object_id, form_url, extra_context=extra_context)

    def save_model(self, request, obj, form, change):
        reply_body = request.POST.get("staff_reply", "").strip()
        super().save_model(request, obj, form, change)

        if reply_body:
            SupportMessage.objects.create(
                thread=obj,
                author=request.user,
                is_staff=True,
                body=reply_body,
            )
            SupportThread.objects.filter(pk=obj.pk).update(updated_at=timezone.now())
            messages.success(request, _("پاسخ شما ارسال شد."))

    class Media:
        css = {"all": ("admin/css/forms.css",)}


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "is_staff", "author", "body_preview", "created_at")
    list_filter = ("is_staff",)
    search_fields = ("body", "thread__guest_name", "thread__subject", "author__username")
    readonly_fields = ("thread", "author", "is_staff", "body", "created_at")

    @admin.display(description=_("متن"))
    def body_preview(self, obj: SupportMessage) -> str:
        text = obj.body.strip()
        return text[:60] + ("…" if len(text) > 60 else "")
