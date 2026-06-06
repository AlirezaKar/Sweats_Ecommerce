"""Convert uploaded raster images to WebP. SVG icons are left unchanged."""

from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image

WEBP_QUALITY = 85

# Icons stay as-is (typically SVG). WebP is already final.
SKIP_EXTENSIONS = {".webp", ".svg"}


def convert_image_field_to_webp(
    instance,
    field_name: str,
    *,
    quality: int = WEBP_QUALITY,
) -> bool:
    """
    Replace the file on ``field_name`` with a WebP version.
    Returns True if the field was converted.
    """
    field = getattr(instance, field_name, None)
    if not field or not field.name:
        return False

    ext = Path(field.name).suffix.lower()
    if ext in SKIP_EXTENSIONS:
        return False

    field.open("rb")
    try:
        with Image.open(field) as img:
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")

            buffer = BytesIO()
            save_kwargs: dict = {"format": "WEBP", "quality": quality}
            if img.mode == "RGBA":
                save_kwargs["lossless"] = False
            img.save(buffer, **save_kwargs)
    finally:
        field.close()

    base_name = Path(field.name).stem
    new_name = str(Path(field.name).with_name(f"{base_name}.webp"))
    field.save(new_name, ContentFile(buffer.getvalue()), save=False)
    return True


def convert_model_image_fields(instance, *field_names: str) -> list[str]:
    """Convert named ImageFields on a saved model instance. Returns updated field names."""
    updated: list[str] = []
    for name in field_names:
        if convert_image_field_to_webp(instance, name):
            updated.append(name)
    return updated
