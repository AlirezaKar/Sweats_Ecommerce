from rest_framework import serializers

from app_chat.models import SupportMessage, SupportThread


class SupportMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = ("id", "body", "is_staff", "author_name", "created_at")

    def get_author_name(self, obj: SupportMessage) -> str:
        if obj.is_staff:
            return "پشتیبانی"
        if obj.author_id:
            name = obj.author.get_full_name().strip()
            return name or obj.author.username
        return "کاربر"


class SupportThreadSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportThread
        fields = (
            "id",
            "subject",
            "source",
            "status",
            "messages",
            "updated_at",
        )


class SupportMessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField(min_length=1, max_length=4000)

    def validate_body(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("پیام نمی‌تواند خالی باشد.")
        return cleaned


class ContactFormSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=120)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    subject = serializers.CharField(min_length=2, max_length=200)
    message = serializers.CharField(min_length=3, max_length=4000)

    def validate_name(self, value: str) -> str:
        return value.strip()

    def validate_subject(self, value: str) -> str:
        return value.strip()

    def validate_message(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("پیام خیلی کوتاه است.")
        return cleaned
