from django.contrib import admin

from .models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "label",
        "city",
        "pincode",
        "phone_number",
        "user",
        "is_default",
    )
    list_filter = ("label", "is_default", "city")
    search_fields = (
        "full_name",
        "address",
        "city",
        "pincode",
        "phone_number",
        "user__username",
        "user__email",
    )
    list_select_related = ("user",)
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-is_default", "-created_at")
