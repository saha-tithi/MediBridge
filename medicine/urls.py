from django.urls import path

from .views import (MedicineListAPIView,MedicineDetailAPIView,)

urlpatterns = [
    path("",MedicineListAPIView.as_view(),name="medicine-list",),
    path("<uuid:pk>/",MedicineDetailAPIView.as_view(),name="medicine-detail",),
]