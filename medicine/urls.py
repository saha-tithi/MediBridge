from django.urls import path

from .views import (MedicineListAPIView,MedicineDetailAPIView,PharmacistInventoryListAPIView)

urlpatterns = [
    path("",MedicineListAPIView.as_view(),name="medicine-list",),
    path("<uuid:pk>/",MedicineDetailAPIView.as_view(),name="medicine-detail",),
    path("pharmacist/inventory/",PharmacistInventoryListAPIView.as_view(),name="pharmacist-inventory-list",),
]