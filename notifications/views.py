from django.db import models
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification, NotificationRead
from .serializers import NotificationSerializer


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role not in ["PHARMACIST", "ADMIN"]:
            return Notification.objects.none()
        return Notification.objects.filter(
    models.Q(
        notification_type=Notification.NotificationType.NEW_ORDER
    )
    |
    models.Q(
        notification_type=Notification.NotificationType.LOW_STOCK,
        is_active=True,
    )
).select_related(
    "order",
    "medicine",
)
        


class NotificationUnreadCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role not in ["PHARMACIST", "ADMIN"]:
            return Response(
                {
                    "success": True,
                    "data": {
                        "unread_count": 0,
                    },
                },
                status=status.HTTP_200_OK,
            )

        total_notifications = Notification.objects.filter(
            is_active=True
        )

        read_notifications = NotificationRead.objects.filter(
            user=request.user,
            notification__is_active=True,
        ).values_list(
            "notification_id",
            flat=True,
        )

        unread_count = total_notifications.exclude(
            id__in=read_notifications
        ).count()

        return Response(
            {
                "success": True,
                "data": {
                    "unread_count": unread_count,
                },
            },
            status=status.HTTP_200_OK,
        )


class NotificationMarkReadAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role not in ["PHARMACIST", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to access notifications.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        notification = get_object_or_404(
            Notification,
            pk=pk,
            is_active=True,
        )

        NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user,
        )

        serializer = NotificationSerializer(
            notification,
            context={"request": request},
        )

        return Response(
            {
                "success": True,
                "message": "Notification marked as read.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):

        if request.user.role not in ["PHARMACIST", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to access notifications.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        notifications = Notification.objects.filter(
            is_active=True
        )

        read_records = [
            NotificationRead(
                notification=notification,
                user=request.user,
            )
            for notification in notifications
            if not NotificationRead.objects.filter(
                notification=notification,
                user=request.user,
            ).exists()
        ]

        if read_records:
            NotificationRead.objects.bulk_create(
                read_records,
                ignore_conflicts=True,
            )

        return Response(
            {
                "success": True,
                "message": "All notifications marked as read.",
            },
            status=status.HTTP_200_OK,
        )