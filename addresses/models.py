from django.conf import settings
from django.db import models


class Address(models.Model):

    LABEL_CHOICES = (
        ("HOME", "Home"),
        ("WORK", "Work"),
        ("OTHER", "Other"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    label = models.CharField(
        max_length=20,
        choices=LABEL_CHOICES,
        default="HOME",
    )

    full_name = models.CharField(
        max_length=150,
    )

    phone_number = models.CharField(
        max_length=15,
    )

    address = models.TextField()

    city = models.CharField(
        max_length=100,
    )

    pincode = models.CharField(
        max_length=6,
    )

    is_default = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label} - {self.full_name}"