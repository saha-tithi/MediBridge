import logging

from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _send(order, subject, body):

    # Email delivery must never fail the request: by the time these
    # helpers run, the order/payment has already been committed and
    # the cart cleared. Raising here turned a successful operation
    # into an HTTP 500 the client reports as a failure.

    try:

        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email],
            fail_silently=False,
        )

    except Exception:

        logger.exception(
            "Failed to send email %r for order %s",
            subject,
            order.id,
        )


def send_order_placed_email(order):
    customer = order.customer

    _send(
        order,
        "MediBridge - Order Placed Successfully",
        (
            f"Hello {customer.username},\n\n"
            f"Your MediBridge order has been placed successfully.\n\n"
            f"Order ID: {order.id}\n"
            f"Total Amount: ₹{order.total_amount}\n"
            f"Status: {order.status}\n\n"
            f"Thank you for using MediBridge."
        ),
    )


def send_order_delivered_email(order):
    customer = order.customer

    _send(
        order,
        "MediBridge - Order Delivered",
        (
            f"Hello {customer.username},\n\n"
            f"Your MediBridge order has been delivered successfully.\n\n"
            f"Order ID: {order.id}\n"
            f"Total Amount: ₹{order.total_amount}\n"
            f"Status: {order.status}\n\n"
            f"Thank you for using MediBridge."
        ),
    )
