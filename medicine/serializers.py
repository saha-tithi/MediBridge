from rest_framework import serializers

from .models import Category, Medicine, Inventory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = (
            "id",
            "stock",
            "selling_price",
            "batch_number",
            "expiry_date",
            "is_available",
        )


class MedicineListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()

    class Meta:
        model = Medicine
        fields = (
            "id",
            "brand_name",
            "generic_name",
            "strength",
            "manufacturer",
            "requires_prescription",
            "image",
            "category",
        )


class MedicineDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    inventories = InventorySerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = (
            "id",
            "category",
            "brand_name",
            "generic_name",
            "strength",
            "manufacturer",
            "description",
            "requires_prescription",
            "image",
            "inventories",
            "created_at",
            "updated_at",
        )


class MedicineCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = (
            "category",
            "brand_name",
            "generic_name",
            "strength",
            "manufacturer",
            "description",
            "requires_prescription",
            "image",
        )