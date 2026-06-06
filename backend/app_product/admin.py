from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from django.utils.translation import gettext_lazy as _

from app_product.models import Category, Comment, Product, ProductImage


class ProductImageInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        main_count = sum(
            1
            for form in self.forms
            if form.cleaned_data
            and not form.cleaned_data.get("DELETE")
            and form.cleaned_data.get("is_main")
        )
        if main_count > 1:
            raise ValidationError(
                "هر محصول فقط یک تصویر اصلی می‌تواند داشته باشد."
            )


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    formset = ProductImageInlineFormSet
    extra = 1
    fields = ("image", "alt_text", "order", "is_main")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "order", "is_active", "created_at")
    list_filter = ("is_active", "parent")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("order", "name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "discounted_price", "stock", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("title", "en_title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at",)
    inlines = [ProductImageInline]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "category",
                    "title",
                    "en_title",
                    "slug",
                    "description",
                    "detailed_description",
                )
            },
        ),
        (
            "قیمت و موجودی",
            {"fields": ("price", "discounted_price", "stock")},
        ),
        (
            "نمایش",
            {"fields": ("is_active", "created_at")},
        ),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "alt_text", "order", "is_main")
    list_filter = ("is_main",)
    search_fields = ("product__title", "alt_text")


@admin.action(description=_("تایید نظرات انتخاب‌شده"))
def approve_product_comments(modeladmin, request, queryset):
    updated = queryset.update(is_approved=True)
    if updated:
        messages.success(request, _("%(count)s نظر تایید شد.") % {"count": updated})


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "parent", "rating", "is_approved", "created_at", "text_preview")
    list_filter = ("is_approved", "rating")
    search_fields = ("product__title", "user__username", "text")
    readonly_fields = ("created_at",)
    actions = [approve_product_comments]
    list_editable = ("is_approved",)

    @admin.display(description=_("متن"))
    def text_preview(self, obj: Comment) -> str:
        return obj.text[:60] + ("…" if len(obj.text) > 60 else "")
