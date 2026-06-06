from django.db import migrations, models


def migrate_product_details(apps, schema_editor):
    Product = apps.get_model("app_product", "Product")
    ProductFeatureBlock = apps.get_model("app_product", "ProductFeatureBlock")

    for product in Product.objects.all():
        parts: list[str] = []

        specs = product.specifications or {}
        if isinstance(specs, dict) and specs:
            spec_lines = [f"{key}: {value}" for key, value in specs.items()]
            parts.append("\n".join(spec_lines))

        blocks = ProductFeatureBlock.objects.filter(product_id=product.pk).order_by("order", "id")
        for block in blocks:
            block_parts = []
            if block.title:
                block_parts.append(str(block.title))
            if block.description:
                block_parts.append(str(block.description))
            if block_parts:
                parts.append("\n\n".join(block_parts))

        if parts and not product.detailed_description:
            product.detailed_description = "\n\n".join(parts)
            product.save(update_fields=["detailed_description"])


class Migration(migrations.Migration):

    dependencies = [
        ("app_product", "0002_alter_category_icon_help_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="detailed_description",
            field=models.TextField(
                blank=True,
                help_text="متن آزاد برای جزئیات بیشتر محصول — در صفحه محصول نمایش داده می‌شود.",
                verbose_name="توضیحات تکمیلی",
            ),
        ),
        migrations.RunPython(migrate_product_details, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="product",
            name="specifications",
        ),
        migrations.DeleteModel(
            name="ProductFeatureBlock",
        ),
    ]
