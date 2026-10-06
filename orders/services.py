from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from cart.models import Cart
from orders.models import Order, OrderItem
from prescriptions.models import Prescription
from notifications.models import Notification
from notifications.services import update_low_stock_notification


@transaction.atomic
def create_order(
    customer,
    shipping_address,
    payment_method,
):

    try:
        cart = Cart.objects.select_for_update().get(
            customer=customer
        )

    except Cart.DoesNotExist:
        raise ValueError(
            "Cart does not exist."
        )


    cart_items = cart.items.select_related(
        "medicine",
        "prescription",
    ).all()


    if not cart_items.exists():
        raise ValueError(
            "Your cart is empty."
        )


    total_amount = Decimal("0.00")


    for cart_item in cart_items:

        total_amount += cart_item.subtotal


    # =========================================================
    # ONLINE ORDERS: reuse the outstanding unpaid order
    # =========================================================
    #
    # The cart is deliberately left intact until the Razorpay payment
    # is verified, so previously EVERY abandoned or retried checkout
    # minted another PLACED/PENDING order (measured: 12 -> 13 from a
    # single retry). Reuse the newest unpaid one and rebuild it from
    # the current cart instead of creating a fresh order.

    order = None


    if payment_method == Order.PaymentMethod.ONLINE:

        order = (
            Order.objects.select_for_update()
            .filter(
                customer=customer,
                payment_method=Order.PaymentMethod.ONLINE,
                payment_status=Order.PaymentStatus.PENDING,
                status=Order.Status.PLACED,
            )
            .order_by("-created_at")
            .first()
        )


    if order is None:

        order = Order.objects.create(
            customer=customer,
            status=Order.Status.PLACED,
            payment_status=Order.PaymentStatus.PENDING,
            payment_method=payment_method,
            total_amount=total_amount,
            shipping_address=shipping_address,
        )

    else:

        order.shipping_address = shipping_address

        order.total_amount = total_amount

        # The cached Razorpay order was created against the old
        # total, so drop it and let /razorpay/create/ mint a new one
        # for the current amount.
        order.razorpay_order_id = ""

        order.save(
            update_fields=[
                "shipping_address",
                "total_amount",
                "razorpay_order_id",
                "updated_at",
            ]
        )

        order.items.all().delete()


    for cart_item in cart_items:

        OrderItem.objects.create(
            order=order,
            medicine=cart_item.medicine,
            prescription=cart_item.prescription,
            is_prescription_item=cart_item.is_prescription_item,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            subtotal=cart_item.subtotal,
        )


    if payment_method == Order.PaymentMethod.COD:

        # A COD order is real the moment it exists. An ONLINE order
        # is not: notifying the pharmacist here announced orders that
        # were never paid for. That notification now fires in
        # VerifyRazorpayPaymentAPIView, once the payment is verified.

        Notification.objects.create(
            notification_type=Notification.NotificationType.NEW_ORDER,
            title="New Order",
            message=(
                f"Order #{str(order.id)[:8].upper()} has been placed "
                f"for ₹{order.total_amount}."
            ),
            order=order,
        )

        cart_items.delete()


    return order


@transaction.atomic
def process_order(order):

    # Lock the order row so concurrent "process" calls
    # cannot both pass the status check below.
    order = Order.objects.select_for_update().get(pk=order.pk)

    if order.status != Order.Status.PLACED:

        raise ValueError(
            "Only placed orders can be processed."
        )


    if (
        order.payment_method == Order.PaymentMethod.ONLINE
        and order.payment_status != Order.PaymentStatus.PAID
    ):

        raise ValueError(
            "Online payment must be completed before "
            "the order can be processed."
        )


    for item in order.items.select_related(
        "medicine",
        "prescription",
    ).all():

        # =================================================
        # PRESCRIPTION CHECK
        # =================================================

        if item.is_prescription_item:

            if item.prescription is None:

                raise ValueError(
                    f"Prescription is missing for "
                    f"{item.medicine.brand_name}."
                )


            if (
                item.prescription.status
                != Prescription.Status.VERIFIED
            ):

                raise ValueError(
                    f"Prescription for "
                    f"{item.medicine.brand_name} "
                    f"has not been verified by the pharmacist."
                )


        # =================================================
        # FIND TOTAL AVAILABLE STOCK
        # =================================================

        inventories = (
            item.medicine.inventories
            .select_for_update()
            .filter(
                is_available=True,
                stock__gt=0,
                # Match cart/services.get_available_inventories —
                # otherwise an expired batch is consumed (FEFO) and
                # shipped to the customer.
                expiry_date__gte=timezone.now().date(),
            )
            .order_by("expiry_date")
        )


        total_available = sum(
            inventory.stock
            for inventory in inventories
        )


        if total_available < item.quantity:

            raise ValueError(
                f"Insufficient stock for "
                f"{item.medicine.brand_name}. "
                f"Only {total_available} unit(s) available."
            )

        remaining_quantity = item.quantity


        for inventory in inventories:

            if remaining_quantity <= 0:
                break


            quantity_to_take = min(
                inventory.stock,
                remaining_quantity,
            )


            inventory.stock -= quantity_to_take

            if inventory.stock == 0:

                inventory.is_available = False


            inventory.save(
                update_fields=[
                    "stock",
                    "is_available",
                    "updated_at",
                ]
            )


            remaining_quantity -= quantity_to_take
        update_low_stock_notification(
            item.medicine
        )
    order.status = Order.Status.PACKED


    order.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )


    return order




@transaction.atomic
def update_order_status(
    order,
    new_status,
):

    allowed_transitions = {

        Order.Status.PACKED: [
            Order.Status.SHIPPED,
        ],

        Order.Status.SHIPPED: [
            Order.Status.DELIVERED,
        ],

    }


    current_status = order.status


    if current_status not in allowed_transitions:

        raise ValueError(
            f"Order cannot be moved from "
            f"{current_status}."
        )


    if new_status not in allowed_transitions[
        current_status
    ]:

        raise ValueError(
            f"Cannot move order from "
            f"{current_status} to {new_status}."
        )


    order.status = new_status


    order.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )


    return order