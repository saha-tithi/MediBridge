from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import AllowAny
from .models import Medicine
from .serializers import (MedicineListSerializer,MedicineDetailSerializer,)
from django.shortcuts import render


class MedicineListAPIView(generics.ListAPIView):
    
    queryset = ( Medicine.objects.select_related("category").prefetch_related("inventories").all() )
    serializer_class = MedicineListSerializer
    permission_classes = [AllowAny]

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


class MedicineDetailAPIView(generics.RetrieveAPIView):

    queryset = (Medicine.objects.select_related("category").prefetch_related("inventories").all())
    serializer_class = MedicineDetailSerializer
    permission_classes = [AllowAny]



def medicine_list_page(request):
    medicines = Medicine.objects.select_related("category").all()

    return render(
        request,
        "medicines/medicine_list.html",
        {
            "medicines": medicines,
        },
    )
def medicine_detail_page(request, pk):
    medicine = Medicine.objects.select_related("category").prefetch_related("inventories").get(pk=pk)

    return render(
        request,
        "medicines/medicine_detail.html",
        {
            "medicine": medicine,
        },
    )