from rest_framework import serializers

from .models import Cart, CartItem
from medicine.models import Medicine
from prescriptions.models import Prescription


class AddToCartSerializer(serializers.Serializer):

    medicine_id = serializers.UUIDField()

    quantity = serializers.IntegerField(
        min_value=1
    )

    prescription_id = serializers.UUIDField(
        required=False,
        allow_null=True,
    )


    def validate_medicine_id(self, value):

        if not Medicine.objects.filter(
            id=value
        ).exists():

            raise serializers.ValidationError(
                "Medicine not found."
            )

        return value


    def validate_prescription_id(self, value):

        if value is None:
            return value

        request = self.context["request"]

        if not Prescription.objects.filter(
            id=value,
            customer=request.user,
        ).exists():

            raise serializers.ValidationError(
                "Invalid prescription."
            )

        return value



class UpdateCartItemSerializer(serializers.Serializer):

    quantity = serializers.IntegerField(
        min_value=1
    )



class CartItemSerializer(serializers.ModelSerializer):

    medicine_name = serializers.CharField(
        source="medicine.brand_name",
        read_only=True,
    )
    medicine_id = serializers.UUIDField(
        source="medicine.id",
        read_only=True,
    )



    class Meta:

        model = CartItem

        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "quantity",
            "unit_price",
            "subtotal",
            "is_prescription_item",
        )



class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    total = serializers.SerializerMethodField()


    class Meta:

        model = Cart

        fields = (
            "id",
            "items",
            "total",
        )


    def get_total(self, obj):

        return sum(
            item.subtotal
            for item in obj.items.all()
        )