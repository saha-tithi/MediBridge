from django.contrib import admin

from .models import Notification, NotificationRead


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ("notification", "user", "read_at")
    list_select_related = ("notification", "user")
    search_fields = (
        "user__username",
        "user__email",
        "notification__title",
    )
    readonly_fields = ("notification", "user", "read_at")

    def has_add_permission(self, request):
        # Read receipts are created when a pharmacist opens the list.
        return False


class NotificationReadInline(admin.TabularInline):
    model = NotificationRead
    extra = 0
    can_delete = False
    fields = ("user", "read_at")
    readonly_fields = ("user", "read_at")
    autocomplete_fields = ("user",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "notification_type",
        "title",
        "short_message",
        "linked_to",
        "is_active",
        "created_at",
    )
    list_filter = ("notification_type", "is_active", "created_at")
    search_fields = (
        "title",
        "message",
        "=order__id",
        "medicine__brand_name",
    )
    list_select_related = ("order", "medicine")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    readonly_fields = (
        "notification_type",
        "title",
        "message",
        "order",
        "medicine",
        "created_at",
        "updated_at",
    )
    fields = readonly_fields + ("is_active",)

    inlines = [NotificationReadInline]

    @admin.display(description="Message")
    def short_message(self, obj):
        text = obj.message or ""
        return text if len(text) <= 70 else text[:67] + "..."

    @admin.display(description="Linked to")
    def linked_to(self, obj):
        if obj.order is not None:
            return f"Order {str(obj.order_id)[:8].upper()}"
        if obj.medicine is not None:
            return obj.medicine.brand_name
        return "-"
