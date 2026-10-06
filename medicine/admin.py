from django.contrib import admin
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.html import format_html

from .models import Category, Inventory, Medicine


def usable_stock_sum():
    """Sum of available, unexpired batches.

    Deliberately the same maths as cart/services.py and
    orders/services.py, so the admin shows the number the store
    actually sells from rather than a raw batch total.
    """
    today = timezone.now().date()
    return Coalesce(
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


class ExpiryStatusFilter(admin.SimpleListFilter):
    title = "expiry status"
    parameter_name = "expiry_status"

    def lookups(self, request, model_admin):
        return (
            ("expired", "Expired"),
            ("usable", "Not expired"),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()
        if self.value() == "expired":
            return queryset.filter(expiry_date__lt=today)
        if self.value() == "usable":
            return queryset.filter(expiry_date__gte=today)
        return queryset


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "medicine_count", "created_at")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Medicines", ordering="_medicine_count")
    def medicine_count(self, obj):
        return obj._medicine_count

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(_medicine_count=Count("medicines"))
        )


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = (
        "brand_name",
        "generic_name",
        "category",
        "strength",
        "manufacturer",
        "requires_prescription",
        "is_active",
        "total_stock",
    )
    list_filter = ("category", "requires_prescription", "is_active")
    list_editable = ("requires_prescription", "is_active")
    list_select_related = ("category",)
    search_fields = (
        "=id",
        "brand_name",
        "generic_name",
        "manufacturer",
    )
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")
    ordering = ("brand_name",)

    @admin.display(description="Sellable stock", ordering="_usable_stock")
    def total_stock(self, obj):
        units = obj._usable_stock
        if units <= 0:
            return format_html(
                '<span class="mb-badge mb-badge--out">Out</span>'
            )
        return units

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(_usable_stock=usable_stock_sum())
        )


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "batch_number",
        "stock",
        "selling_price",
        "expiry_date",
        "expired",
        "is_available",
    )
    list_filter = (
        "is_available",
        ExpiryStatusFilter,
        ("expiry_date", admin.DateFieldListFilter),
    )
    search_fields = (
        "batch_number",
        "medicine__brand_name",
        "medicine__generic_name",
    )
    autocomplete_fields = ("medicine",)
    date_hierarchy = "expiry_date"
    list_select_related = ("medicine",)
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Expired", boolean=True, ordering="expiry_date")
    def expired(self, obj):
        return obj.expiry_date < timezone.now().date()
