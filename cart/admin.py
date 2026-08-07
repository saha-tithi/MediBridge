from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = (
        "unit_price",
        "subtotal",
        "created_at",
    )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "customer__username",
        "customer__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "cart",
        "quantity",
        "unit_price",
        "subtotal",
        "is_prescription_item",
        "created_at",
    )

    list_filter = (
        "is_prescription_item",
    )

    search_fields = (
        "medicine__brand_name",
        "cart__customer__username",
    )

    readonly_fields = (
        "unit_price",
        "subtotal",
        "created_at",
    )