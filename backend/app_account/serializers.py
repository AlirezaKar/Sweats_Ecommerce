from rest_framework import serializers

from app_account.models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "title",
            "province",
            "city",
            "postal_address",
            "postal_code",
            "receiver_name",
            "receiver_phone",
            "is_default",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class AddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
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

    def validate_receiver_phone(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) != 11 or not cleaned.isdigit():
            raise serializers.ValidationError("شماره گیرنده باید ۱۱ رقم باشد.")
        return cleaned

    def validate_postal_code(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) != 10 or not cleaned.isdigit():
            raise serializers.ValidationError("کد پستی باید ۱۰ رقم باشد.")
        return cleaned
