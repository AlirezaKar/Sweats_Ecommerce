from django.db import transaction
from django.db.models import F
from django.shortcuts import redirect
from django.views import View
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from app_account.models import Address
from app_order.models import Cart, CartItem, Order, OrderItem
from app_order.serializers import (
    CartItemWriteSerializer,
    CartMergeSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)
from app_product.models import Product
from config.utils.frontend import build_frontend_url, origin_from_request, store_payment_return_origin


def get_or_create_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def cart_queryset(user):
    return (
        CartItem.objects.filter(cart__user=user)
        .select_related("cart", "product", "product__category")
        .prefetch_related("product__images")
        .order_by("id")
    )


def serialize_cart(request, items) -> dict:
    item_list = list(items)
    total = sum(item.line_total for item in item_list)
    count = sum(item.quantity for item in item_list)
    from app_order.serializers import CartItemSerializer

    return {
        "items": CartItemSerializer(item_list, many=True, context={"request": request}).data,
        "item_count": count,
        "total_price": total,
    }


def resolve_checkout_address(user, data) -> Address:
    address_id = data.get("address_id")
    if address_id:
        address = Address.objects.filter(user=user, pk=address_id).first()
        if not address:
            raise ValueError("آدرس یافت نشد.")
        return address

    address_payload = data["address"]
    return Address.objects.create(user=user, **address_payload)


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = cart_queryset(request.user)
        return Response(serialize_cart(request, items))


class CartItemAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        product = Product.objects.filter(pk=product_id, is_active=True).first()
        if not product:
            return Response({"detail": "محصول یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        if product.stock <= 0:
            return Response({"detail": "این محصول ناموجود است."}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request.user)
        item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > product.stock:
                return Response(
                    {"detail": f"حداکثر موجودی این محصول {product.stock} عدد است."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
            item.save(update_fields=["quantity"])
        elif quantity > product.stock:
            item.delete()
            return Response(
                {"detail": f"حداکثر موجودی این محصول {product.stock} عدد است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = cart_queryset(request.user)
        return Response(serialize_cart(request, items), status=status.HTTP_201_CREATED)


class CartItemUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def patch(self, request, item_id):
        quantity = request.data.get("quantity")
        if not isinstance(quantity, int) or quantity < 1:
            return Response({"detail": "تعداد نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)

        item = (
            CartItem.objects.select_for_update()
            .select_related("product")
            .filter(cart__user=request.user, pk=item_id)
            .first()
        )
        if not item:
            return Response({"detail": "آیتم سبد یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        if quantity > item.product.stock:
            return Response(
                {"detail": f"حداکثر موجودی این محصول {item.product.stock} عدد است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save(update_fields=["quantity"])
        items = cart_queryset(request.user)
        return Response(serialize_cart(request, items))


class CartItemDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        deleted, _ = CartItem.objects.filter(cart__user=request.user, pk=item_id).delete()
        if not deleted:
            return Response({"detail": "آیتم سبد یافت نشد."}, status=status.HTTP_404_NOT_FOUND)
        items = cart_queryset(request.user)
        return Response(serialize_cart(request, items))


class CartMergeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CartMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_or_create_cart(request.user)

        for entry in serializer.validated_data["items"]:
            product = Product.objects.filter(pk=entry["product_id"], is_active=True).first()
            if not product or product.stock <= 0:
                continue
            qty = min(entry["quantity"], product.stock)
            item, created = CartItem.objects.select_for_update().get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": qty},
            )
            if not created:
                item.quantity = min(item.quantity + qty, product.stock)
                item.save(update_fields=["quantity"])

        items = cart_queryset(request.user)
        return Response(serialize_cart(request, items))


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        from app_payment.gateway import PaymentGatewayError, initiate_order_payment

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = list(cart_queryset(request.user))
        if not items:
            return Response({"detail": "سبد خرید خالی است."}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            if item.product.stock < item.quantity:
                return Response(
                    {"detail": f"موجودی «{item.product.title}» کافی نیست."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            address = resolve_checkout_address(request.user, serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        total_price = sum(item.line_total for item in items)
        order = Order.objects.create(
            user=request.user,
            address=address,
            total_price=total_price,
            status=Order.Status.PENDING,
            is_paid=False,
        )

        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product=item.product,
                    price=item.product.final_price,
                    quantity=item.quantity,
                )
                for item in items
            ]
        )

        try:
            payment = initiate_order_payment(order, request)
        except PaymentGatewayError as exc:
            order.status = Order.Status.CANCELED
            order.save(update_fields=["status"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        order.authority = payment.authority
        order.save(update_fields=["authority"])

        return_origin = origin_from_request(request)
        if return_origin:
            store_payment_return_origin(payment.authority, return_origin)

        return Response(
            {
                "order_id": order.id,
                "payment_url": payment.payment_url,
                "detail": "در حال انتقال به درگاه پرداخت…",
            },
            status=status.HTTP_201_CREATED,
        )


class OrderPaymentCallbackView(View):
    def get(self, request):
        from app_payment.gateway import PaymentGatewayError, verify_order_payment

        authority = request.GET.get("Authority", "")
        status_param = request.GET.get("Status", "")

        if not authority:
            return redirect(build_frontend_url("/orders", payment="invalid"))

        try:
            with transaction.atomic():
                order = (
                    Order.objects.select_for_update()
                    .prefetch_related("items__product")
                    .get(authority=authority)
                )

                if order.is_paid:
                    return redirect(
                        build_frontend_url(
                            "/orders",
                            authority=authority,
                            payment="success",
                            order=order.id,
                        )
                    )

                if status_param != "OK":
                    if not order.is_paid and order.status == Order.Status.PENDING:
                        order.status = Order.Status.CANCELED
                        order.save(update_fields=["status"])
                    return redirect(
                        build_frontend_url(
                            "/orders",
                            authority=authority,
                            payment="canceled",
                            order=order.id,
                        )
                    )

                try:
                    ref_id = verify_order_payment(order)
                except PaymentGatewayError:
                    if not order.is_paid and order.status == Order.Status.PENDING:
                        order.status = Order.Status.CANCELED
                        order.save(update_fields=["status"])
                    return redirect(
                        build_frontend_url(
                            "/orders",
                            authority=authority,
                            payment="failed",
                            order=order.id,
                        )
                    )

                order.refresh_from_db()
                if not order.is_paid:
                    for order_item in order.items.all():
                        product = Product.objects.select_for_update().get(pk=order_item.product_id)
                        if product.stock < order_item.quantity:
                            order.status = Order.Status.CANCELED
                            order.save(update_fields=["status"])
                            return redirect(
                                build_frontend_url(
                                    "/orders",
                                    authority=authority,
                                    payment="failed",
                                    order=order.id,
                                )
                            )
                        Product.objects.filter(pk=product.pk).update(
                            stock=F("stock") - order_item.quantity
                        )

                    order.is_paid = True
                    order.status = Order.Status.PROCESSING
                    order.save(update_fields=["is_paid", "status"])

                    product_ids = list(order.items.values_list("product_id", flat=True))
                    CartItem.objects.filter(
                        cart__user=order.user,
                        product_id__in=product_ids,
                    ).delete()

                return redirect(
                    build_frontend_url(
                        "/orders",
                        authority=authority,
                        payment="success",
                        order=order.id,
                        ref=ref_id,
                    )
                )
        except Order.DoesNotExist:
            return redirect(build_frontend_url("/orders", payment="invalid"))


class OrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer
    pagination_class = None

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("address").prefetch_related(
            "items__product"
        )
