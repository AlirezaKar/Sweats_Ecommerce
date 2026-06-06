# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_content", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="blogcomment",
            name="is_approved",
            field=models.BooleanField(
                default=False,
                help_text="نظر پس از تایید در سایت نمایش داده می‌شود",
                verbose_name="تایید شده",
            ),
        ),
    ]
