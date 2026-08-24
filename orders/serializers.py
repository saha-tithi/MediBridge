from rest_framework import serializers
from .models import Order, OrderItem


class CreateOrderSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(max_length=500)
    payment_method = serializers.ChoiceField(
        choices=[
            Order.PaymentMethod.ONLINE,
            Order.PaymentMethod.COD,
        ]
    )


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.brand_name",read_only=True,)
    medicine_id = serializers.UUIDField(source="medicine.id",read_only=True,)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "quantity",
            "unit_price",
            "subtotal",
            "is_prescription_item",
            "prescription",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True,read_only=True,)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "payment_status",
            "payment_method",
            "total_amount",
            "shipping_address",
            "items",
            "created_at",
            "updated_at",
        )