from rest_framework import serializers

from .models import Category, Medicine, Inventory


# =========================================================
# CATEGORY
# =========================================================

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = "__all__"


# =========================================================
# CUSTOMER — INVENTORY
# =========================================================

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


# =========================================================
# CUSTOMER — MEDICINE LIST
# =========================================================

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


# =========================================================
# CUSTOMER — MEDICINE DETAIL
# =========================================================

class MedicineDetailSerializer(serializers.ModelSerializer):

    category = CategorySerializer(
        read_only=True
    )

    inventories = InventorySerializer(
        many=True,
        read_only=True
    )

    available_stock = serializers.SerializerMethodField()

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
            "is_active",
            "image",
            "inventories",
            "available_stock",
            "created_at",
            "updated_at",
        )

    def get_available_stock(self, obj):

        return sum(
            inventory.stock
            for inventory in obj.inventories.all()
            if inventory.is_available
            and inventory.stock > 0
        )


# =========================================================
# MEDICINE — CREATE / UPDATE
# =========================================================

class MedicineCreateUpdateSerializer(
    serializers.ModelSerializer
):

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

# =========================================================
# PHARMACIST — UPDATE MEDICINE
# =========================================================

class PharmacistMedicineUpdateSerializer(
    serializers.ModelSerializer
):

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
            "is_active",
        )
# =========================================================
# PHARMACIST — INVENTORY
# =========================================================

class PharmacistInventorySerializer(
    serializers.ModelSerializer
):

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


# =========================================================
# PHARMACIST — MEDICINE WITHOUT INVENTORY
# =========================================================

class PharmacistMedicineWithoutInventorySerializer(
    serializers.ModelSerializer
):

    medicine_id = serializers.UUIDField(
        source="id",
        read_only=True,
    )

    medicine_name = serializers.CharField(
        source="brand_name",
        read_only=True,
    )

    generic_name = serializers.CharField(
        read_only=True,
    )

    strength = serializers.CharField(
        read_only=True,
    )

    id = serializers.SerializerMethodField()

    stock = serializers.SerializerMethodField()

    selling_price = serializers.SerializerMethodField()

    batch_number = serializers.SerializerMethodField()

    expiry_date = serializers.SerializerMethodField()

    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Medicine

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

    def get_id(self, obj):
        return None

    def get_stock(self, obj):
        return 0

    def get_selling_price(self, obj):
        return None

    def get_batch_number(self, obj):
        return None

    def get_expiry_date(self, obj):
        return None

    def get_is_available(self, obj):
        return False


# =========================================================
# PHARMACIST — UPDATE INVENTORY
# =========================================================

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


# =========================================================
# PHARMACIST — ADD NEW PRODUCT
# =========================================================

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
            "stock": validated_data.pop(
                "stock"
            ),

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


# =========================================================
# PHARMACIST — ADD NEW BATCH
# =========================================================

class PharmacistCreateBatchSerializer(
    serializers.ModelSerializer
):

    medicine = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all()
    )

    stock = serializers.IntegerField(
        min_value=0
    )

    selling_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0
    )

    batch_number = serializers.CharField(
        max_length=100
    )

    expiry_date = serializers.DateField()

    is_available = serializers.BooleanField(
        default=True
    )

    class Meta:
        model = Inventory

        fields = (
            "medicine",
            "stock",
            "selling_price",
            "batch_number",
            "expiry_date",
            "is_available",
        )

    def validate_batch_number(self, value):

        medicine = self.initial_data.get(
            "medicine"
        )

        if medicine:

            exists = Inventory.objects.filter(
                medicine_id=medicine,
                batch_number=value
            ).exists()

            if exists:

                raise serializers.ValidationError(
                    "This batch number already exists for this medicine."
                )

        return value

    def create(self, validated_data):

        return Inventory.objects.create(
            **validated_data
        )