from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.db.models import Count

from .models import User


@admin.register(User)
class CustomUserAdmin(DjangoUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "admin_access",
        "order_count",
        "created_at",
    )
    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "groups",
        ("date_joined", admin.DateFieldListFilter),
    )
    search_fields = (
        "username",
        "email",
        "phone_number",
        "first_name",
        "last_name",
    )
    search_help_text = "Username, email, phone number, or real name."
    ordering = ("username",)
    date_hierarchy = "created_at"

    actions = ("grant_admin_access", "revoke_admin_access")

    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Additional Information",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "created_at",
                )
            },
        ),
    )

    # Django's stock add form omits email entirely, but MediBridge
    # treats email as a login identifier (see accounts/serializers.py).
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (
            "Contact",
            {
                "classes": ("wide",),
                "fields": ("email", "role", "phone_number"),
            },
        ),
    )

    readonly_fields = ("created_at",)

    # ------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------

    @admin.action(description="Grant admin access (staff + superuser)")
    def grant_admin_access(self, request, queryset):
        updated = queryset.filter(is_active=True).update(
            is_staff=True,
            is_superuser=True,
        )
        self.message_user(
            request,
            f"Granted admin access to {updated} user(s).",
        )

    @admin.action(description="Revoke admin access")
    def revoke_admin_access(self, request, queryset):
        # Never lock yourself out of the admin you are standing in.
        updated = queryset.exclude(pk=request.user.pk).update(
            is_staff=False,
            is_superuser=False,
        )
        self.message_user(
            request,
            f"Revoked admin access from {updated} user(s).",
        )

    # ------------------------------------------------------------
    # Display helpers
    # ------------------------------------------------------------

    @admin.display(description="Admin access", boolean=True, ordering="is_staff")
    def admin_access(self, obj):
        return obj.is_staff

    @admin.display(description="Orders", ordering="_order_count")
    def order_count(self, obj):
        return obj._order_count

    def get_queryset(self, request):
        # Annotate once so the Orders column is not an N+1 query.
        return (
            super()
            .get_queryset(request)
            .annotate(_order_count=Count("orders", distinct=True))
        )
