"""Template tags backing the MediBridge admin dashboard."""

from decimal import Decimal

from django import template
from django.db.models import Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from accounts.models import User
from medicine.models import Medicine
from notifications.services import LOW_STOCK_THRESHOLD
from orders.models import Order
from prescriptions.models import Prescription

register = template.Library()


@register.simple_tag
def get_admin_stats():
    """Figures behind the cards on the admin index page."""
    today = timezone.now().date()

    # A COD order is only marked PAID when it is delivered, and an
    # online order when the Razorpay signature is verified — so PAID
    # is money that has actually arrived.
    revenue = (
        Order.objects.filter(
            payment_status=Order.PaymentStatus.PAID
        )
        .exclude(status=Order.Status.CANCELLED)
        .aggregate(total=Sum("total_amount"))["total"]
        or Decimal("0.00")
    )

    orders_today = Order.objects.filter(
        created_at__date=today
    ).count()

    pending_prescriptions = Prescription.objects.filter(
        status=Prescription.Status.PENDING
    ).count()

    # Online orders created but never paid for. The checkout keeps
    # these around until the payment is verified, so a rising number
    # usually means customers are abandoning the payment step.
    unpaid_online = Order.objects.filter(
        payment_method=Order.PaymentMethod.ONLINE,
        payment_status=Order.PaymentStatus.PENDING,
        status=Order.Status.PLACED,
    ).count()

    # Stock maths matches cart/services and orders/services.process_order:
    # only available, unexpired batches count towards the usable total.
    low_stock = (
        Medicine.objects.filter(is_active=True)
        .annotate(
            usable_stock=Coalesce(
                Sum(
                    "inventories__stock",
                    filter=Q(
                        inventories__is_available=True,
                        inventories__stock__gt=0,
                        inventories__expiry_date__gte=today,
                    ),
                ),
                Value(0),
            )
        )
        .filter(usable_stock__lte=LOW_STOCK_THRESHOLD)
        .count()
    )

    return {
        "orders_today": orders_today,
        "revenue": revenue,
        "pending_prescriptions": pending_prescriptions,
        "unpaid_online": unpaid_online,
        "low_stock": low_stock,
        "low_stock_threshold": LOW_STOCK_THRESHOLD,
        "customers": User.objects.filter(
            role=User.Role.CUSTOMER
        ).count(),
        "active_medicines": Medicine.objects.filter(
            is_active=True
        ).count(),
    }
