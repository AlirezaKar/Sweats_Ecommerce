from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path
from django.utils.translation import gettext_lazy as _

from app_main.backup import BackupError, create_database_backup, list_database_backups


def database_backup_view(request):
    if not request.user.is_superuser:
        messages.error(request, _("فقط مدیر ارشد می‌تواند پشتیبان بگیرد."))
        return redirect("admin:index")

    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        try:
            backup = create_database_backup(name)
            messages.success(
                request,
                _("پشتیبان با موفقیت ایجاد شد: %(filename)s") % {"filename": backup.filename},
            )
        except BackupError as exc:
            messages.error(request, str(exc))
        return redirect("admin:database-backup")

    backups = list_database_backups()
    context = {
        **admin.site.each_context(request),
        "title": _("پشتیبان‌گیری پایگاه داده"),
        "backups": backups,
        "default_name_hint": _("خالی بگذارید تا نام پیش‌فرض استفاده شود."),
    }
    return render(request, "admin/app_main/database_backup.html", context)


_original_get_urls = admin.site.get_urls


def _get_urls_with_backup():
    custom_urls = [
        path(
            "database-backup/",
            admin.site.admin_view(database_backup_view),
            name="database-backup",
        ),
    ]
    return custom_urls + _original_get_urls()


admin.site.get_urls = _get_urls_with_backup
