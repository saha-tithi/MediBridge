from django.urls import path
from .views import (PrescriptionUploadAPIView,PrescriptionListAPIView,PrescriptionDetailAPIView,PrescriptionExtractAPIView,)

urlpatterns = [
    path("",PrescriptionListAPIView.as_view(),name="prescription-list",),
    path("upload/",PrescriptionUploadAPIView.as_view(),name="prescription-upload",),
    path("<uuid:pk>/",PrescriptionDetailAPIView.as_view(),name="prescription-detail",),
     path("<uuid:pk>/extract/",PrescriptionExtractAPIView.as_view(),name="prescription-extract",),
]