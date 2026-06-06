# Generated manually

import app_product.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_product", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="category",
            name="icon",
            field=models.FileField(
                blank=True,
                help_text="فقط SVG — بدون تبدیل به WebP",
                null=True,
                upload_to=app_product.models.category_icon_upload_to,
                verbose_name="آیکون",
            ),
        ),
    ]
