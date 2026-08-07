from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Prescription
from .serializers import (PrescriptionUploadSerializer,PrescriptionListSerializer,PrescriptionDetailSerializer,)


class PrescriptionUploadAPIView(generics.CreateAPIView):
    serializer_class = PrescriptionUploadSerializer
    permission_classes = [IsAuthenticated]


class PrescriptionListAPIView(generics.ListAPIView):
    serializer_class = PrescriptionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(customer=self.request.user)


class PrescriptionDetailAPIView(generics.RetrieveAPIView):
    serializer_class = PrescriptionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(customer=self.request.user)