from django.db.models import F
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from app_chat.models import SupportMessage, SupportThread
from app_chat.serializers import (
    ContactFormSerializer,
    SupportMessageCreateSerializer,
    SupportMessageSerializer,
    SupportThreadSerializer,
)


def get_or_create_widget_thread(user) -> SupportThread:
    thread, _ = SupportThread.objects.get_or_create(
        user=user,
        source=SupportThread.Source.WIDGET,
        defaults={"status": SupportThread.Status.OPEN},
    )
    return thread


class SupportThreadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        thread = get_or_create_widget_thread(request.user)
        messages = thread.messages.select_related("author").order_by("created_at")
        data = SupportThreadSerializer(thread).data
        data["messages"] = SupportMessageSerializer(messages, many=True).data
        return Response(data)


class SupportMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SupportMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        thread = get_or_create_widget_thread(request.user)
        if thread.status == SupportThread.Status.CLOSED:
            thread.status = SupportThread.Status.OPEN
            thread.save(update_fields=["status", "updated_at"])

        message = SupportMessage.objects.create(
            thread=thread,
            author=request.user,
            is_staff=False,
            body=serializer.validated_data["body"],
        )
        SupportThread.objects.filter(pk=thread.pk).update(
            staff_unread_count=F("staff_unread_count") + 1,
            updated_at=timezone.now(),
        )

        return Response(
            {
                "message": SupportMessageSerializer(message).data,
                "detail": "پیام شما ارسال شد.",
            },
            status=status.HTTP_201_CREATED,
        )


class ContactFormView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        thread = SupportThread.objects.create(
            user=request.user if request.user.is_authenticated else None,
            guest_name=data["name"],
            guest_email=data.get("email") or "",
            guest_phone=data.get("phone") or "",
            subject=data["subject"],
            source=SupportThread.Source.CONTACT,
            staff_unread_count=1,
        )
        SupportMessage.objects.create(
            thread=thread,
            author=request.user if request.user.is_authenticated else None,
            is_staff=False,
            body=data["message"],
        )

        return Response(
            {
                "thread_id": thread.id,
                "detail": "پیام شما ثبت شد. به‌زودی با شما تماس می‌گیریم.",
            },
            status=status.HTTP_201_CREATED,
        )
