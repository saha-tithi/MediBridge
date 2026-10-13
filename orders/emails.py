import json
import logging
import threading
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


# Render's free tier firewalls outbound traffic to ports 25/465/587, so a
# Gmail app password cannot deliver from production - the TCP connection is
# dropped before authentication ever starts. Brevo's transactional API is
# plain HTTPS, which that firewall does not touch, so it is the transport
# that actually reaches the internet from Render.
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

SENDER_NAME = "MediBridge"


def _send_brevo(recipient, subject, body):

    # Raised from here to deliver(), which logs it. Never to the caller:
    # both call sites run after the order is already committed.

    sender_email = settings.DEFAULT_FROM_EMAIL

    if not sender_email:

        raise RuntimeError(
            "DEFAULT_FROM_EMAIL is empty. Brevo only accepts a sender "
            "address that has been verified in the Brevo dashboard."
        )

    payload = json.dumps(
        {
            "sender": {
                "email": sender_email,
                "name": SENDER_NAME,
            },
            "to": [{"email": recipient}],
            "subject": subject,
            "textContent": body,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        BREVO_API_URL,
        data=payload,
        method="POST",
        headers={
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=settings.EMAIL_TIMEOUT,
        ) as response:

            # read() closes the connection cleanly instead of leaving it
            # for the socket GC in a worker that may live a long time.
            response.read()

    except urllib.error.HTTPError as error:

        # urlopen raises on any 4xx/5xx, and the part worth logging -
        # what Brevo actually objected to - is in the body. Without it
        # the log says only "HTTP Error 401", which cannot be acted on.
        detail = (
            error.read().decode("utf-8", "replace")[:300]
        )

        raise RuntimeError(
            f"Brevo refused the message (HTTP {error.code}): {detail}"
        ) from error


def _send_smtp(recipient, subject, body):

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )


def _send(order, subject, body):

    # Email delivery must never fail the request: by the time these
    # helpers run, the order/payment has already been committed and
    # the cart cleared. Raising here turned a successful operation
    # into an HTTP 500 the client reports as a failure.
    #
    # It must also never DELAY the request. Both call sites run inside
    # an HTTP handler - CreateOrderAPIView sends before it writes the
    # 201, and the Razorpay verify path sends before its response - so
    # the customer paid for the delivery round trip as a frozen checkout
    # page. Render's free tier firewalls outbound SMTP, so on production
    # that round trip does not merely fail, it hangs.
    #
    # Everything is read off the model here, in the request thread, so
    # the worker thread never touches the ORM or holds a DB connection.

    recipient = order.customer.email
    order_id = order.id

    def deliver():

        try:

            if settings.BREVO_API_KEY:

                _send_brevo(recipient, subject, body)

            else:

                # Loud rather than silent: on Render this path cannot
                # work at all, and a missing key is otherwise invisible
                # until someone wonders why no mail ever arrives.
                logger.warning(
                    "BREVO_API_KEY is not set - using SMTP for order %s. "
                    "SMTP is firewalled on Render's free tier, so this "
                    "only delivers from outside Render.",
                    order_id,
                )

                _send_smtp(recipient, subject, body)

        except Exception:

            logger.exception(
                "Failed to send email %r for order %s",
                subject,
                order_id,
            )

    # daemon so a hung socket can never keep the worker process alive;
    # EMAIL_TIMEOUT is the actual deadline on both transports.
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
