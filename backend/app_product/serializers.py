from django.db.models import Prefetch
from rest_framework import serializers

from app_product.models import Category, Comment, Product, ProductImage


def absolute_media_url(request, file_field) -> str | None:
    if not file_field:
        return None
    url = file_field.url
    if request:
        return request.build_absolute_uri(url)
    return url


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "parent",
            "order",
            "image",
        )

    def get_image(self, obj: Category) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.image)


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt_text", "order", "is_main")

    def get_url(self, obj: ProductImage) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.image)


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "user_name",
            "is_staff",
            "text",
            "rating",
            "is_verified_buyer",
            "created_at",
            "replies",
        )

    def get_user_name(self, obj: Comment) -> str:
        return obj.user.get_full_name() or obj.user.username

    def get_is_staff(self, obj: Comment) -> bool:
        return obj.user.is_staff or obj.user.is_superuser

    def get_replies(self, obj: Comment) -> list:
        replies = getattr(obj, "_prefetched_replies", None)
        if replies is None:
            replies = obj.replies.filter(is_approved=True).select_related("user").order_by("created_at")
        return CommentSerializer(replies, many=True, context=self.context).data


class CommentCreateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(),
        source="parent",
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Comment
        fields = ("text", "rating", "parent_id")

    def validate_text(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("متن نظر خیلی کوتاه است.")
        return cleaned

    def validate(self, attrs):
        parent = attrs.get("parent")
        product = self.context["product"]
        if parent and parent.product_id != product.id:
            raise serializers.ValidationError({"parent_id": "نظر والد متعلق به این محصول نیست."})
        if parent:
            attrs["rating"] = Comment.Rating.FIVE
        elif attrs.get("rating") is None:
            attrs["rating"] = Comment.Rating.FIVE
        return attrs


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    main_image = serializers.SerializerMethodField()
    final_price = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "slug",
            "price",
            "discounted_price",
            "final_price",
            "is_on_sale",
            "stock",
            "category_name",
            "category_slug",
            "main_image",
        )

    def get_main_image(self, obj: Product) -> str | None:
        img = obj.images.filter(is_main=True).first() or obj.images.first()
        if not img:
            return None
        return absolute_media_url(self.context.get("request"), img.image)


class ProductDetailSerializer(ProductListSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description",
            "detailed_description",
            "en_title",
            "category",
            "images",
            "comments",
            "created_at",
        )

    def get_comments(self, obj: Product) -> list:
        qs = (
            obj.comments.filter(is_approved=True, parent__isnull=True)
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "replies",
                    queryset=Comment.objects.filter(is_approved=True)
                    .select_related("user")
                    .order_by("created_at"),
                )
            )
            .order_by("-created_at")[:50]
        )
        return CommentSerializer(qs, many=True, context=self.context).data
