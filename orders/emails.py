import logging
import threading

from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _send(order, subject, body):

    # Email delivery must never fail the request: by the time these
    # helpers run, the order/payment has already been committed and
    # the cart cleared. Raising here turned a successful operation
    # into an HTTP 500 the client reports as a failure.
    #
    # It must also never DELAY the request. Both call sites run inside
    # an HTTP handler - CreateOrderAPIView sends before it writes the
    # 201, and the Razorpay verify path sends before its response - so
    # the customer paid for the SMTP round trip as a frozen checkout
    # page. Render's free tier firewalls outbound 25/465/587, so on
    # production that round trip does not merely fail, it hangs.
    #
    # Everything is read off the model here, in the request thread, so
    # the worker thread never touches the ORM or holds a DB connection.

    recipient = order.customer.email
    order_id = order.id

    def deliver():

        try:

            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )

        except Exception:

            logger.exception(
                "Failed to send email %r for order %s",
                subject,
                order_id,
            )

    # daemon so a hung socket can never keep the worker process alive;
    # EMAIL_TIMEOUT is the actual deadline on that socket.
    threading.Thread(
        target=deliver,
        name=f"order-email-{order_id}",
        daemon=True,
    ).start()


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
