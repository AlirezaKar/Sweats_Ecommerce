from django.db.models import F, Prefetch
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from app_product.models import Category, Comment, Product, ProductImage
from app_product.serializers import (
    CategorySerializer,
    CommentCreateSerializer,
    CommentSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class StandardPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100


class CategoryListView(ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by("order", "name")


class ProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images")
            .order_by("-created_at")
        )

        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        if self.request.query_params.get("on_sale") in ("1", "true", "True"):
            qs = qs.filter(
                discounted_price__isnull=False,
                discounted_price__lt=F("price"),
            )

        return qs


class ProductDetailView(RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related(
                Prefetch("images", queryset=ProductImage.objects.order_by("order", "id")),
                "comments",
            )
        )


class RelatedProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        slug = self.kwargs["slug"]
        product = Product.objects.filter(slug=slug, is_active=True).first()
        if not product:
            return Product.objects.none()
        return (
            Product.objects.filter(is_active=True, category=product.category)
            .exclude(pk=product.pk)
            .select_related("category")
            .prefetch_related("images")[:4]
        )


class ProductCommentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        product = Product.objects.filter(is_active=True, slug=slug).first()
        if not product:
            return Response({"detail": "محصول یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CommentCreateSerializer(
            data=request.data,
            context={"product": product, "request": request},
        )
        serializer.is_valid(raise_exception=True)

        parent = serializer.validated_data.get("parent")
        user = request.user
        is_approved = user.is_staff or user.is_superuser

        comment = Comment.objects.create(
            product=product,
            user=user,
            parent=parent,
            text=serializer.validated_data["text"],
            rating=serializer.validated_data.get("rating", Comment.Rating.FIVE),
            is_approved=is_approved,
        )

        return Response(
            {
                "comment": CommentSerializer(comment, context={"request": request}).data,
                "pending_approval": not comment.is_approved,
                "detail": (
                    "نظر شما ثبت شد و پس از تایید نمایش داده می‌شود."
                    if not comment.is_approved
                    else "نظر شما منتشر شد."
                ),
            },
            status=status.HTTP_201_CREATED,
        )
