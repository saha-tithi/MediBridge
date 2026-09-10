from django.db import transaction

from .models import Notification


LOW_STOCK_THRESHOLD = 10


@transaction.atomic
def update_low_stock_notification(medicine):
    """
    Update the low-stock notification for a medicine.

    Low stock is calculated using the total usable stock
    across all available batches.
    """

    total_stock = sum(
        inventory.stock
        for inventory in medicine.inventories.filter(
            is_available=True,
            stock__gt=0,
        )
    )

    low_stock = (
        total_stock <= LOW_STOCK_THRESHOLD
    )


    active_notification = (
        Notification.objects
        .filter(
            notification_type=Notification.NotificationType.LOW_STOCK,
            medicine=medicine,
            is_active=True,
        )
        .first()
    )


    # =========================================================
    # MEDICINE IS LOW IN STOCK
    # =========================================================

    if low_stock:

        if active_notification:

            return active_notification


        notification = Notification.objects.create(
            notification_type=Notification.NotificationType.LOW_STOCK,
            title="Low Stock",
            message=(
                f"{medicine.brand_name} "
                f"({medicine.strength}) is low in stock. "
                f"Only {total_stock} unit(s) available."
            ),
            medicine=medicine,
            is_active=True,
        )

        return notification


    # =========================================================
    # MEDICINE IS NOT LOW IN STOCK
    # =========================================================

    if active_notification:

        active_notification.is_active = False

        active_notification.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )


    return None