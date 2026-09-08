from django.urls import path

from .views import (MedicineListAPIView,MedicineDetailAPIView,PharmacistCategoryListAPIView,PharmacistCategoryCreateAPIView,PharmacistInventoryListAPIView,PharmacistCreateProductAPIView,PharmacistInventoryUpdateAPIView,PharmacistCreateBatchAPIView)

urlpatterns = [
    path("",MedicineListAPIView.as_view(),name="medicine-list",),
    path("<uuid:pk>/",MedicineDetailAPIView.as_view(),name="medicine-detail",),
    path("pharmacist/inventory/",PharmacistInventoryListAPIView.as_view(),name="pharmacist-inventory-list",),
      path("categories/create/",PharmacistCategoryCreateAPIView.as_view(),name="pharmacist-category-create",),
     path("categories/",PharmacistCategoryListAPIView.as_view(),name="pharmacist-category-list",),

    path("pharmacist/inventory/<int:pk>/",PharmacistInventoryUpdateAPIView.as_view(),name="pharmacist-inventory-update",),

    path("pharmacist/products/",PharmacistCreateProductAPIView.as_view(),name="pharmacist-product-create",),
    path("pharmacist/batches/",PharmacistCreateBatchAPIView.as_view(),name="pharmacist-batch-create",),
]