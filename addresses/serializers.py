from rest_framework import serializers

from .models import Address


class AddressSerializer(serializers.ModelSerializer):

    class Meta:

        model = Address

        fields = (
            "id",
            "label",
            "full_name",
            "phone_number",
            "address",
            "city",
            "pincode",
            "is_default",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


    def validate_pincode(self, value):

        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError(
                "Pincode must be exactly 6 digits."
            )

        return value


    def validate_phone_number(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Enter a valid phone number."
            )

        return value