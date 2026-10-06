from rest_framework import serializers
from .models import Prescription

# Must match what static/js/upload_prescription.js advertises.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


class PrescriptionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = (
            "id",
            "prescription",
        )

    def validate_prescription(self, value):
        content_type = getattr(value, "content_type", "") or ""

        # The extension decides the Content-Type the file is
        # served with, so it must be checked too — otherwise a
        # .html/.svg payload sent with content_type image/jpeg
        # would execute same-origin (JWTs live in localStorage).
        extension = str(getattr(value, "name", "") or "").rsplit(
            ".", 1
        )
        extension = (
            f".{extension[-1].lower()}" if len(extension) == 2 else ""
        )

        if (
            content_type not in ALLOWED_CONTENT_TYPES
            or extension not in ALLOWED_EXTENSIONS
        ):
            raise serializers.ValidationError(
                "Only JPG, PNG or PDF files are allowed."
            )

        if value.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError(
                "Prescription file must be 10 MB or smaller."
            )

        return value

    def create(self, validated_data):
        return Prescription.objects.create( customer=self.context["request"].user,**validated_data,)


class PrescriptionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = (
            "id",
            "status",
            "uploaded_at",
        )


class PrescriptionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = (
            "id",
            "prescription",
            "status",
            "extracted_text",
            "extracted_medicines",
            "pharmacist_note",
            "uploaded_at",
            "updated_at",
        )