from rest_framework import serializers

import mimetypes
import os

from app_content.models import BlogComment, BlogPost, Course, CourseEpisode, CourseFile, CourseReview, Tutorial
from app_product.serializers import absolute_media_url


class BlogPostListSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "thumbnail",
            "published_at",
            "comment_count",
            "author_name",
        )

    def get_thumbnail(self, obj: BlogPost) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.thumbnail)

    def get_author_name(self, obj: BlogPost) -> str:
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Admin"


class BlogCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = (
            "id",
            "user_name",
            "is_staff",
            "text",
            "created_at",
            "replies",
        )

    def get_user_name(self, obj: BlogComment) -> str:
        return obj.user.get_full_name() or obj.user.username

    def get_is_staff(self, obj: BlogComment) -> bool:
        return obj.user.is_staff or obj.user.is_superuser

    def get_replies(self, obj: BlogComment) -> list:
        replies = getattr(obj, "_prefetched_replies", None)
        if replies is None:
            replies = obj.replies.filter(is_approved=True).select_related("user").order_by("created_at")
        return BlogCommentSerializer(replies, many=True, context=self.context).data


class BlogCommentCreateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogComment.objects.all(),
        source="parent",
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = BlogComment
        fields = ("text", "parent_id")

    def validate_text(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("متن نظر خیلی کوتاه است.")
        return cleaned

    def validate(self, attrs):
        parent = attrs.get("parent")
        post = self.context["post"]
        if parent and parent.post_id != post.id:
            raise serializers.ValidationError({"parent_id": "نظر والد متعلق به این مقاله نیست."})
        return attrs


class BlogPostDetailSerializer(BlogPostListSerializer):
    body = serializers.CharField(read_only=True)
    comments = BlogCommentSerializer(many=True, read_only=True)

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ("body", "updated_at", "comments")


class TutorialSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Tutorial
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "thumbnail",
            "video_url",
            "duration_minutes",
            "created_at",
        )

    def get_thumbnail(self, obj: Tutorial) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.thumbnail)


class CourseEpisodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseEpisode
        fields = (
            "id",
            "title",
            "slug",
            "order",
            "video_url",
            "duration_minutes",
            "is_preview",
            "description",
        )


class CourseListSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    episode_count = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)
    level_label = serializers.CharField(source="get_level_display", read_only=True)
    first_episode_slug = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "instructor_name",
            "thumbnail",
            "level",
            "level_label",
            "is_free",
            "price",
            "episode_count",
            "total_duration_minutes",
            "first_episode_slug",
            "is_enrolled",
            "created_at",
        )

    def get_thumbnail(self, obj: Course) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.thumbnail)

    def get_first_episode_slug(self, obj: Course) -> str | None:
        episodes = list(obj.episodes.all())
        if not episodes:
            return None
        episodes.sort(key=lambda ep: (ep.order, ep.id))
        return episodes[0].slug

    def get_is_enrolled(self, obj: Course) -> bool:
        if getattr(obj, "_user_enrolled", None) is not None:
            return bool(obj._user_enrolled)
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.enrollments.filter(user_id=request.user.id).exists()


class CourseReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = ("id", "rating", "text", "user_name", "is_approved", "created_at")

    def get_user_name(self, obj: CourseReview) -> str:
        return obj.user.get_full_name() or obj.user.username


class CourseReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(min_length=3, max_length=2000)

    def validate_text(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("متن نظر خیلی کوتاه است.")
        return cleaned


class CourseDetailSerializer(CourseListSerializer):
    episodes = CourseEpisodeSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("episodes",)


class CourseFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    content_type = serializers.SerializerMethodField()

    class Meta:
        model = CourseFile
        fields = ("id", "title", "url", "filename", "content_type", "order", "created_at")

    def get_url(self, obj: CourseFile) -> str | None:
        return absolute_media_url(self.context.get("request"), obj.file)

    def get_filename(self, obj: CourseFile) -> str:
        if obj.original_filename:
            return obj.original_filename
        if obj.file:
            return os.path.basename(obj.file.name)
        return ""

    def get_content_type(self, obj: CourseFile) -> str:
        if not obj.file:
            return "application/octet-stream"
        guessed, _ = mimetypes.guess_type(obj.original_filename or obj.file.name)
        return guessed or "application/octet-stream"
