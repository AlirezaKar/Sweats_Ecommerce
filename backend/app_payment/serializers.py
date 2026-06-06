from django.db.models import Sum
from rest_framework import serializers

from app_payment.models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    pending_top_up = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ("balance", "pending_top_up", "updated_at")

    def get_pending_top_up(self, obj: Wallet) -> int:
        total = (
            obj.transactions.filter(
                tx_type=WalletTransaction.TxType.TOP_UP,
                status=WalletTransaction.Status.PENDING,
            ).aggregate(total=Sum("amount"))["total"]
        )
        return total or 0


class WalletTransactionSerializer(serializers.ModelSerializer):
    tx_type_label = serializers.CharField(source="get_tx_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = WalletTransaction
        fields = (
            "id",
            "tx_type",
            "tx_type_label",
            "amount",
            "balance_after",
            "status",
            "status_label",
            "description",
            "reference_code",
            "created_at",
        )


class WalletTopUpSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=1000, max_value=500_000_000)
    confirm_immediately = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Dev only: credit wallet immediately without payment gateway.",
    )
    frontend_origin = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_amount(self, value):
        if value % 1000 != 0:
            raise serializers.ValidationError("مبلغ باید مضرب ۱۰۰۰ تومان باشد.")
        return value
