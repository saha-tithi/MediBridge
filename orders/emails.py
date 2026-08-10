from django.core.mail import send_mail
from django.conf import settings


def send_order_placed_email(order):
    customer = order.customer

    send_mail(
        subject="MediBridge - Order Placed Successfully",
        message=(
            f"Hello {customer.username},\n\n"
            f"Your MediBridge order has been placed successfully.\n\n"
            f"Order ID: {order.id}\n"
            f"Total Amount: ₹{order.total_amount}\n"
            f"Status: {order.status}\n\n"
            f"Thank you for using MediBridge."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[customer.email],
        fail_silently=False,
    )


def send_order_delivered_email(order):
    customer = order.customer

    send_mail(
        subject="MediBridge - Order Delivered",
        message=(
            f"Hello {customer.username},\n\n"
            f"Your MediBridge order has been delivered successfully.\n\n"
            f"Order ID: {order.id}\n"
            f"Total Amount: ₹{order.total_amount}\n"
            f"Status: {order.status}\n\n"
            f"Thank you for using MediBridge."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[customer.email],
        fail_silently=False,
    )