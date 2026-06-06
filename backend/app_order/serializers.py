from rest_framework import serializers

from app_account.serializers import AddressCreateSerializer, AddressSerializer
from app_order.models import CartItem, Order, OrderItem
from app_product.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    line_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "quantity", "line_total")


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    item_count = serializers.IntegerField()
    total_price = serializers.IntegerField()


class CartItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class CartMergeSerializer(serializers.Serializer):
    items = CartItemWriteSerializer(many=True)


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    line_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_title",
            "product_slug",
            "price",
            "quantity",
            "line_total",
        )


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "status_label",
            "total_price",
            "is_paid",
            "tracking_code",
            "item_count",
            "created_at",
        )

    def get_item_count(self, obj: Order) -> int:
        return obj.items.count()


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = AddressSerializer(read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + ("items", "address")


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False)
    address = AddressCreateSerializer(required=False)

    def validate(self, attrs):
        if not attrs.get("address_id") and not attrs.get("address"):
            raise serializers.ValidationError("انتخاب یا ثبت آدرس الزامی است.")
        return attrs
