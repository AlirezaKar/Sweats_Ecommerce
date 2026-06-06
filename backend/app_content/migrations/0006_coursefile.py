import app_content.models
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("app_content", "0005_coursepurchase"),
    ]

    operations = [
        migrations.CreateModel(
            name="CourseFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200, verbose_name="عنوان")),
                ("file", models.FileField(upload_to=app_content.models.course_file_upload_to, verbose_name="فایل")),
                ("original_filename", models.CharField(blank=True, max_length=255, verbose_name="نام فایل")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="ترتیب")),
                ("is_active", models.BooleanField(default=True, verbose_name="فعال")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="تاریخ آپلود")),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="files",
                        to="app_content.course",
                        verbose_name="دوره",
                    ),
                ),
            ],
            options={
                "verbose_name": "فایل دوره",
                "verbose_name_plural": "فایل‌های دوره",
                "ordering": ["order", "id"],
            },
        ),
    ]
