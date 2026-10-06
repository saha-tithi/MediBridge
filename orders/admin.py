from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem


BADGE_TONES = {
    "PLACED": "placed",
    "PROCESSING": "processing",
    "PACKED": "packed",
    "SHIPPED": "shipped",
    "DELIVERED": "delivered",
    "CANCELLED": "cancelled",
}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    verbose_name_plural = "Items"
    fields = (
        "medicine",
        "is_prescription_item",
        "quantity",
        "unit_price",
        "subtotal",
        "prescription",
    )
    readonly_fields = fields
    autocomplete_fields = ("medicine",)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("medicine", "prescription")
        )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Read-only audit view of an order.

    Order state is produced by the guarded transitions in
    orders/services.py and by the Razorpay verification in
    orders/views.py. Letting the admin edit ``payment_status`` or
    ``status`` directly would recreate the payment bypass that was
    removed from that code, so nothing here is editable and orders
    cannot be added or deleted through the admin.
    """

    inlines = [OrderItemInline]

    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    list_select_related = ("customer",)
    list_per_page = 50

    list_display = (
        "short_id",
        "customer",
        "status_badge",
        "payment_method",
        "payment_status",
        "total_amount",
        "created_at",
    )
    list_filter = (
        "status",
        "payment_method",
        "payment_status",
        ("created_at", admin.DateFieldListFilter),
    )
    search_fields = (
        "=id",
        "customer__username",
        "customer__email",
        "razorpay_order_id",
        "razorpay_payment_id",
    )
    search_help_text = (
        "Order UUID, customer username/email, or a Razorpay order/payment id."
    )

    fields = (
        "id",
        "customer",
        "status_badge",
        "payment_method",
        "payment_status",
        "razorpay_order_id",
        "razorpay_payment_id",
        "razorpay_signature",
        "total_amount",
        "shipping_address",
        "created_at",
        "updated_at",
    )
    readonly_fields = fields

    # ------------------------------------------------------------
    # View-only: see the class docstring.
    # ------------------------------------------------------------

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return bool(
            request.user.is_active and request.user.is_staff
        )

    # ------------------------------------------------------------
    # Display helpers
    # ------------------------------------------------------------

    @admin.display(description="Order", ordering="id")
    def short_id(self, obj):
        return str(obj.id)[:8].upper()

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        tone = BADGE_TONES.get(obj.status, "placed")
        return format_html(
            '<span class="mb-badge mb-badge--{}">{}</span>',
            tone,
            obj.get_status_display(),
        )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("customer")
