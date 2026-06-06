from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from app_account.models import Address, User


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = (
        "title",
        "province",
        "city",
        "postal_address",
        "postal_code",
        "receiver_name",
        "receiver_phone",
        "is_default",
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("username",)
    list_display = (
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "email",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = (
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "email",
        "national_id",
    )
    inlines = [AddressInline]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("اطلاعات شخصی"),
            {"fields": ("first_name", "last_name", "email", "phone_number", "national_id")},
        ),
        (
            _("دسترسی"),
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (_("تاریخ‌ها"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "phone_number",
                    "first_name",
                    "last_name",
                    "email",
                    "national_id",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "city", "province", "receiver_name", "is_default")
    list_filter = ("province", "is_default")
    search_fields = ("title", "city", "province", "receiver_name", "receiver_phone", "user__username")
