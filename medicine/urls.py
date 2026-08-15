from django.urls import path

from .views import (MedicineListAPIView,MedicineDetailAPIView,)
from .views import medicine_list_page

urlpatterns = [
    path("",MedicineListAPIView.as_view(),name="medicine-list",),
    path("<uuid:pk>/",MedicineDetailAPIView.as_view(),name="medicine-detail",),
    path("", medicine_list_page, name="medicine-list-page"),
]