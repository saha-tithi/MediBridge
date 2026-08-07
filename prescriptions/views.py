from rest_framework import generics,status
from rest_framework.permissions import IsAuthenticated
from .models import Prescription
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (PrescriptionUploadSerializer,PrescriptionListSerializer,PrescriptionDetailSerializer,)
from ai_engine.services import process_prescription


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



class PrescriptionExtractAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        prescription = generics.get_object_or_404(Prescription,pk=pk,customer=request.user,)

        result = process_prescription(prescription)

        return Response(
            {
                "success": True,
                "message": "Medicines extracted successfully.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )