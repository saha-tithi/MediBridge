from rest_framework import serializers

from .models import Notification, NotificationRead


class NotificationSerializer(serializers.ModelSerializer):

    order_id = serializers.UUIDField(
        source="order.id",
        read_only=True,
        allow_null=True,
    )

    medicine_id = serializers.UUIDField(
        source="medicine.id",
        read_only=True,
        allow_null=True,
    )

    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification

        fields = (
            "id",
            "notification_type",
            "title",
            "message",
            "order_id",
            "medicine_id",
            "is_active",
            "is_read",
            "created_at",
        )

    def get_is_read(self, obj):

        user = self.context["request"].user

        return NotificationRead.objects.filter(
            notification=obj,
            user=user,
        ).exists()