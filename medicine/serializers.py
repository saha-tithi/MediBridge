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

class PharmacistInventorySerializer(serializers.ModelSerializer):
    medicine_id = serializers.UUIDField(
        source="medicine.id",
        read_only=True,
    )

    medicine_name = serializers.CharField(
        source="medicine.brand_name",
        read_only=True,
    )

    generic_name = serializers.CharField(
        source="medicine.generic_name",
        read_only=True,
    )

    strength = serializers.CharField(
        source="medicine.strength",
        read_only=True,
    )

    class Meta:
        model = Inventory
        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "generic_name",
            "strength",
            "stock",
            "selling_price",
            "batch_number",
            "expiry_date",
            "is_available",
        )

class PharmacistInventoryUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Inventory
        fields = (
            "stock",
            "selling_price",
            "is_available",
        )

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Stock cannot be negative."
            )

        return value

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Selling price cannot be negative."
            )

        return value


class PharmacistCreateProductSerializer(
    serializers.ModelSerializer
):
    stock = serializers.IntegerField(
        min_value=0,
        write_only=True,
    )

    selling_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        write_only=True,
    )

    batch_number = serializers.CharField(
        max_length=100,
        write_only=True,
    )

    expiry_date = serializers.DateField(
        write_only=True,
    )

    is_available = serializers.BooleanField(
        default=True,
        write_only=True,
    )

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

            # Initial inventory
            "stock",
            "selling_price",
            "batch_number",
            "expiry_date",
            "is_available",
        )

    def create(self, validated_data):

        inventory_data = {
            "stock": validated_data.pop("stock"),
            "selling_price": validated_data.pop(
                "selling_price"
            ),
            "batch_number": validated_data.pop(
                "batch_number"
            ),
            "expiry_date": validated_data.pop(
                "expiry_date"
            ),
            "is_available": validated_data.pop(
                "is_available"
            ),
        }

        medicine = Medicine.objects.create(
            **validated_data
        )

        Inventory.objects.create(
            medicine=medicine,
            **inventory_data
        )

        return medicine