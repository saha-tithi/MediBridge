from django.urls import path
from .views import (CreateOrderAPIView,OrderDetailAPIView,OrderListAPIView,PharmacistOrderListAPIView,PharmacistOrderDetailAPIView,PharmacistProcessOrderAPIView, PharmacistUpdateOrderStatusAPIView,)

urlpatterns = [
    path("",OrderListAPIView.as_view(),name="order-list",),
    path("create/",CreateOrderAPIView.as_view(),name="order-create",),
    path("<uuid:pk>/",OrderDetailAPIView.as_view(),name="order-detail",),
     path("pharmacist/",PharmacistOrderListAPIView.as_view(),name="pharmacist-order-list",),
    path("pharmacist/<uuid:pk>/",PharmacistOrderDetailAPIView.as_view(),name="pharmacist-order-detail",),
    path("pharmacist/<uuid:pk>/process/",PharmacistProcessOrderAPIView.as_view(),name="pharmacist-process-order",),
    path("pharmacist/<uuid:pk>/status/",PharmacistUpdateOrderStatusAPIView.as_view(),name="pharmacist-update-order-status",),
    ]