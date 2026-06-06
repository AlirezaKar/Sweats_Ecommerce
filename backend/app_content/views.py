from django.db.models import Count, Exists, OuterRef, Prefetch, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.db import transaction
from django.shortcuts import redirect
from django.views import View
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from app_content.models import (
    BlogComment,
    BlogPost,
    Course,
    CourseEnrollment,
    CourseEpisode,
    CourseFile,
    CoursePurchase,
    CourseReview,
    Tutorial,
)
from app_content.serializers import (
    BlogCommentCreateSerializer,
    BlogCommentSerializer,
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    CourseDetailSerializer,
    CourseFileSerializer,
    CourseListSerializer,
    CourseReviewCreateSerializer,
    CourseReviewSerializer,
    TutorialSerializer,
)
from config.utils.frontend import build_frontend_url, origin_from_request, store_payment_return_origin

APPROVED_BLOG_REPLIES = BlogComment.objects.filter(is_approved=True).select_related("user").order_by("created_at")


class StandardPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class BlogPostListView(ListAPIView):
    serializer_class = BlogPostListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            BlogPost.objects.filter(is_published=True)
            .select_related("author")
            .annotate(comment_count=Count("comments", filter=Q(comments__is_approved=True)))
            .order_by("-published_at")
        )


class BlogPostDetailView(RetrieveAPIView):
    serializer_class = BlogPostDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            BlogPost.objects.filter(is_published=True)
            .select_related("author")
            .prefetch_related(
                Prefetch(
                    "comments",
                    queryset=BlogComment.objects.filter(is_approved=True, parent__isnull=True)
                    .select_related("user")
                    .prefetch_related(Prefetch("replies", queryset=APPROVED_BLOG_REPLIES))
                    .order_by("-created_at"),
                )
            )
            .annotate(comment_count=Count("comments", filter=Q(comments__is_approved=True)))
        )


class BlogCommentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        post = BlogPost.objects.filter(is_published=True, slug=slug).first()
        if not post:
            return Response({"detail": "مقاله یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        serializer = BlogCommentCreateSerializer(
            data=request.data,
            context={"post": post, "request": request},
        )
        serializer.is_valid(raise_exception=True)

        comment = BlogComment.objects.create(
            post=post,
            user=request.user,
            parent=serializer.validated_data.get("parent"),
            text=serializer.validated_data["text"],
            is_approved=request.user.is_staff or request.user.is_superuser,
        )

        return Response(
            {
                "comment": BlogCommentSerializer(comment, context={"request": request}).data,
                "pending_approval": not comment.is_approved,
                "detail": (
                    "نظر شما ثبت شد و پس از تایید نمایش داده می‌شود."
                    if not comment.is_approved
                    else "نظر شما منتشر شد."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


def published_courses_queryset(user=None):
    qs = (
        Course.objects.filter(is_published=True)
        .annotate(
            episode_count=Count("episodes"),
            total_duration_minutes=Coalesce(Sum("episodes__duration_minutes"), Value(0)),
        )
        .prefetch_related(
            Prefetch("episodes", queryset=CourseEpisode.objects.order_by("order", "id"))
        )
    )
    if user and user.is_authenticated:
        qs = qs.annotate(
            _user_enrolled=Exists(
                CourseEnrollment.objects.filter(user=user, course=OuterRef("pk"))
            )
        )
    return qs.order_by("-created_at")


class CourseListView(ListAPIView):
    serializer_class = CourseListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return published_courses_queryset(self.request.user)


class CourseDetailView(RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return published_courses_queryset(self.request.user)


class CourseEnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, slug):
        import uuid

        from app_payment.gateway import PaymentGatewayError, initiate_course_purchase

        course = Course.objects.filter(is_published=True, slug=slug).first()
        if not course:
            return Response({"detail": "دوره یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if CourseEnrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {
                    "enrolled": True,
                    "already_enrolled": True,
                    "detail": "این دوره قبلاً به دوره‌های شما اضافه شده است.",
                }
            )

        if course.is_free:
            CourseEnrollment.objects.create(
                user=request.user,
                course=course,
                price_paid=0,
            )
            return Response(
                {
                    "enrolled": True,
                    "already_enrolled": False,
                    "detail": "دوره رایگان به دوره‌های شما اضافه شد.",
                },
                status=status.HTTP_201_CREATED,
            )

        price = course.price or 0
        if price <= 0:
            return Response(
                {"detail": "قیمت دوره نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        CoursePurchase.objects.filter(
            user=request.user,
            course=course,
            status=CoursePurchase.Status.PENDING,
        ).update(status=CoursePurchase.Status.CANCELED)

        ref = f"CP-{uuid.uuid4().hex[:12].upper()}"
        purchase = CoursePurchase.objects.create(
            user=request.user,
            course=course,
            amount=price,
            reference_code=ref,
            status=CoursePurchase.Status.PENDING,
        )

        try:
            payment = initiate_course_purchase(purchase, request)
        except PaymentGatewayError as exc:
            purchase.status = CoursePurchase.Status.FAILED
            purchase.save(update_fields=["status", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        purchase.authority = payment.authority
        purchase.save(update_fields=["authority", "updated_at"])

        return_origin = origin_from_request(request)
        if return_origin:
            store_payment_return_origin(payment.authority, return_origin)

        return Response(
            {
                "enrolled": False,
                "payment_url": payment.payment_url,
                "detail": "در حال انتقال به درگاه پرداخت…",
            },
            status=status.HTTP_201_CREATED,
        )


class CoursePurchaseCallbackView(View):
    """Browser redirect from payment gateway after course purchase."""

    def get(self, request):
        from app_payment.gateway import PaymentGatewayError, verify_course_purchase

        authority = request.GET.get("Authority", "")
        status_param = request.GET.get("Status", "")

        if not authority:
            return redirect(build_frontend_url("/courses", payment="invalid"))

        try:
            with transaction.atomic():
                purchase = (
                    CoursePurchase.objects.select_for_update()
                    .select_related("course", "user")
                    .get(authority=authority)
                )
                slug = purchase.course.slug

                if purchase.status == CoursePurchase.Status.COMPLETED:
                    return redirect(
                        build_frontend_url("/courses", authority=authority, payment="success", course=slug)
                    )

                if status_param != "OK":
                    if purchase.status == CoursePurchase.Status.PENDING:
                        purchase.status = CoursePurchase.Status.CANCELED
                        purchase.save(update_fields=["status", "updated_at"])
                    return redirect(
                        build_frontend_url("/courses", authority=authority, payment="canceled", course=slug)
                    )

                try:
                    ref_id = verify_course_purchase(purchase)
                except PaymentGatewayError:
                    if purchase.status == CoursePurchase.Status.PENDING:
                        purchase.status = CoursePurchase.Status.FAILED
                        purchase.save(update_fields=["status", "updated_at"])
                    return redirect(
                        build_frontend_url("/courses", authority=authority, payment="failed", course=slug)
                    )

                purchase.refresh_from_db()
                if purchase.status == CoursePurchase.Status.PENDING:
                    enrollment, created = CourseEnrollment.objects.get_or_create(
                        user=purchase.user,
                        course=purchase.course,
                        defaults={"price_paid": purchase.amount},
                    )
                    if not created and enrollment.price_paid < purchase.amount:
                        enrollment.price_paid = purchase.amount
                        enrollment.save(update_fields=["price_paid"])

                    purchase.status = CoursePurchase.Status.COMPLETED
                    purchase.reference_code = ref_id
                    purchase.enrollment = enrollment
                    purchase.save(
                        update_fields=["status", "reference_code", "enrollment", "updated_at"]
                    )

                return redirect(
                    build_frontend_url(
                        "/courses",
                        authority=authority,
                        payment="success",
                        course=slug,
                        ref=ref_id,
                    )
                )
        except CoursePurchase.DoesNotExist:
            return redirect(build_frontend_url("/courses", payment="invalid"))


class CourseReviewCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        course = Course.objects.filter(is_published=True, slug=slug).first()
        if not course:
            return Response({"detail": "دوره یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        if CourseReview.objects.filter(course=course, user=request.user).exists():
            return Response(
                {"detail": "شما قبلاً برای این دوره نظر ثبت کرده‌اید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CourseReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = CourseReview.objects.create(
            course=course,
            user=request.user,
            rating=serializer.validated_data["rating"],
            text=serializer.validated_data["text"],
            is_approved=request.user.is_staff or request.user.is_superuser,
        )

        return Response(
            {
                "review": CourseReviewSerializer(review, context={"request": request}).data,
                "pending_approval": not review.is_approved,
                "detail": (
                    "نظر شما ثبت شد و پس از تایید نمایش داده می‌شود."
                    if not review.is_approved
                    else "نظر شما ثبت شد."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class CourseFileListView(APIView):
    """فایل‌های دوره — فقط برای کاربران ثبت‌نام‌شده."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        course = Course.objects.filter(is_published=True, slug=slug).first()
        if not course:
            return Response({"detail": "دوره یافت نشد."}, status=status.HTTP_404_NOT_FOUND)

        enrolled = CourseEnrollment.objects.filter(user=request.user, course=course).exists()
        if not enrolled and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "برای دسترسی به فایل‌های دوره باید در آن ثبت‌نام کنید."},
                status=status.HTTP_403_FORBIDDEN,
            )

        files = CourseFile.objects.filter(course=course, is_active=True).order_by("order", "id")
        return Response(
            CourseFileSerializer(files, many=True, context={"request": request}).data
        )


class CourseMyReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        review = (
            CourseReview.objects.filter(course__slug=slug, course__is_published=True, user=request.user)
            .select_related("course")
            .first()
        )
        if not review:
            return Response({"review": None})
        return Response(
            {"review": CourseReviewSerializer(review, context={"request": request}).data}
        )


class TutorialListView(ListAPIView):
    serializer_class = TutorialSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Tutorial.objects.filter(is_published=True).order_by("-created_at")


class TutorialDetailView(RetrieveAPIView):
    serializer_class = TutorialSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Tutorial.objects.filter(is_published=True)
