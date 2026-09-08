from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Medicine, Inventory, Category

from .serializers import (
    CategorySerializer,
    MedicineListSerializer,
    MedicineDetailSerializer,
    PharmacistInventorySerializer,
    PharmacistMedicineWithoutInventorySerializer,
    PharmacistCreateProductSerializer,
    PharmacistInventoryUpdateSerializer,
    PharmacistCreateBatchSerializer,
)

from django.shortcuts import render

from orders.permissions import IsPharmacistOrAdmin


# =========================================================
# CUSTOMER — MEDICINE LIST
# =========================================================

class MedicineListAPIView(generics.ListAPIView):

    queryset = (
        Medicine.objects
        .select_related("category")
        .prefetch_related("inventories")
        .all()
    )

    serializer_class = MedicineListSerializer

    permission_classes = [
        AllowAny
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "brand_name",
        "generic_name",
        "manufacturer",
    ]

    filterset_fields = [
        "category",
        "requires_prescription",
    ]

    ordering_fields = [
        "brand_name",
        "generic_name",
    ]

    ordering = [
        "brand_name",
    ]


# =========================================================
# CUSTOMER — MEDICINE DETAIL
# =========================================================

class MedicineDetailAPIView(
    generics.RetrieveAPIView
):

    queryset = (
        Medicine.objects
        .select_related("category")
        .prefetch_related("inventories")
        .all()
    )

    serializer_class = MedicineDetailSerializer

    permission_classes = [
        AllowAny
    ]


# =========================================================
# CUSTOMER — MEDICINE LIST PAGE
# =========================================================

def medicine_list_page(request):

    medicines = (
        Medicine.objects
        .select_related("category")
        .all()
    )

    return render(
        request,
        "medicines/medicine_list.html",
        {
            "medicines": medicines,
        },
    )


# =========================================================
# CUSTOMER — MEDICINE DETAIL PAGE
# =========================================================

def medicine_detail_page(request, pk):

    medicine = (
        Medicine.objects
        .select_related("category")
        .prefetch_related("inventories")
        .get(pk=pk)
    )

    return render(
        request,
        "medicines/medicine_detail.html",
        {
            "medicine": medicine,
        },
    )


# =========================================================
# PHARMACIST — INVENTORY
# =========================================================

class PharmacistInventoryListAPIView(
    generics.ListAPIView
):

    permission_classes = [
        IsPharmacistOrAdmin
    ]

    def get_queryset(self):

        return (
            Inventory.objects
            .select_related("medicine")
            .all()
        )

    def list(self, request, *args, **kwargs):

        # -------------------------------------------------
        # Existing inventory batches
        # -------------------------------------------------

        inventory_queryset = (
            self.get_queryset()
        )

        inventory_serializer = (
            PharmacistInventorySerializer(
                inventory_queryset,
                many=True
            )
        )

        inventory_data = (
            inventory_serializer.data
        )


        # -------------------------------------------------
        # Medicines with NO inventory
        # -------------------------------------------------

        medicines_without_inventory = (
            Medicine.objects
            .filter(
                inventories__isnull=True
            )
            .order_by("brand_name")
        )

        medicine_serializer = (
            PharmacistMedicineWithoutInventorySerializer(
                medicines_without_inventory,
                many=True
            )
        )

        medicine_data = (
            medicine_serializer.data
        )


        # -------------------------------------------------
        # Combine both
        # -------------------------------------------------

        combined_data = (
            list(inventory_data)
            +
            list(medicine_data)
        )


        return Response(
            {
                "success": True,
                "message": "Inventory fetched successfully.",
                "data": combined_data,
            }
        )


# =========================================================
# PHARMACIST — CATEGORY LIST
# =========================================================

class PharmacistCategoryListAPIView(
    generics.ListAPIView
):

    queryset = Category.objects.all()

    serializer_class = CategorySerializer

    permission_classes = [
        IsPharmacistOrAdmin
    ]


# =========================================================
# PHARMACIST — UPDATE INVENTORY
# =========================================================

class PharmacistInventoryUpdateAPIView(
    generics.UpdateAPIView
):

    queryset = (
        Inventory.objects
        .select_related("medicine")
        .all()
    )

    serializer_class = (
        PharmacistInventoryUpdateSerializer
    )

    permission_classes = [
        IsPharmacistOrAdmin
    ]

    http_method_names = [
        "patch",
    ]


# =========================================================
# PHARMACIST — ADD NEW PRODUCT
# =========================================================

class PharmacistCreateProductAPIView(
    generics.CreateAPIView
):

    serializer_class = (
        PharmacistCreateProductSerializer
    )

    permission_classes = [
        IsPharmacistOrAdmin
    ]


# =========================================================
# PHARMACIST — ADD NEW BATCH
# =========================================================

class PharmacistCreateBatchAPIView(
    generics.CreateAPIView
):

    serializer_class = (
        PharmacistCreateBatchSerializer
    )

    permission_classes = [
        IsPharmacistOrAdmin
    ]


# =========================================================
# PHARMACIST — CREATE CATEGORY
# =========================================================

class PharmacistCategoryCreateAPIView(
    generics.CreateAPIView
):

    serializer_class = CategorySerializer

    permission_classes = [
        IsPharmacistOrAdmin
    ]