from django.contrib import admin
from django.utils.html import format_html

from .models import Prescription


BADGE_TONES = {
    "PENDING": "pending",
    "VERIFIED": "verified",
    "REJECTED": "rejected",
}


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    """Prescription uploads plus the AI extraction result.

    The image and everything the AI produced are read-only; only the
    pharmacist's verdict (``status``/``pharmacist_note``) is editable,
    mirroring the verify/reject endpoints in prescriptions/views.py.
    """

    date_hierarchy = "uploaded_at"
    ordering = ("-uploaded_at",)
    list_select_related = ("customer",)
    list_per_page = 50

    list_display = (
        "short_id",
        "customer",
        "status_badge",
        "extracted_count",
        "file_link",
        "uploaded_at",
    )
    list_filter = (
        "status",
        ("uploaded_at", admin.DateFieldListFilter),
    )
    search_fields = (
        "=id",
        "customer__username",
        "customer__email",
        "prescription",
        "pharmacist_note",
    )
    search_help_text = (
        "Prescription UUID, customer username/email, filename, or note."
    )

    readonly_fields = (
        "id",
        "customer",
        "prescription",
        "extracted_text",
        "extracted_medicines",
        "uploaded_at",
        "updated_at",
    )
    fields = readonly_fields + ("status", "pharmacist_note")

    def has_add_permission(self, request):
        # A prescription only exists once a customer has uploaded the
        # file; there is nothing meaningful to author by hand.
        return False

    # ------------------------------------------------------------
    # Display helpers
    # ------------------------------------------------------------

    @admin.display(description="Prescription", ordering="id")
    def short_id(self, obj):
        return str(obj.id)[:8].upper()

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        tone = BADGE_TONES.get(obj.status, "pending")
        return format_html(
            '<span class="mb-badge mb-badge--{}">{}</span>',
            tone,
            obj.get_status_display(),
        )

    @admin.display(description="AI matches")
    def extracted_count(self, obj):
        return len(obj.extracted_medicines or [])

    @admin.display(description="File")
    def file_link(self, obj):
        if not obj.prescription:
            return "-"
        return format_html(
            '<a href="{}" target="_blank" rel="noopener">Open image</a>',
            obj.prescription.url,
        )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("customer")
        )
