import uuid

from django.db import models
from django.conf import settings

from medicine.models import Medicine
from orders.models import Order


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        NEW_ORDER = "NEW_ORDER", "New Order"
        LOW_STOCK = "LOW_STOCK", "Low Stock"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    # Used for NEW_ORDER notifications
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Used for LOW_STOCK notifications
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Low-stock notifications remain active only while
    # the medicine is actually low in stock.
    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["notification_type", "is_active"]
            ),
            models.Index(
                fields=["created_at"]
            ),
        ]

    def __str__(self):
        return f"{self.notification_type} - {self.title}"


class NotificationRead(models.Model):

    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name="read_records",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_read_records",
    )

    read_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["notification", "user"],
                name="unique_notification_user_read",
            )
        ]

    def __str__(self):
        return (
            f"{self.user.username} read "
            f"{self.notification.title}"
        )