from rest_framework import serializers
from .models import Prescription


class PrescriptionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = (
            "id",
            "prescription",
        )

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