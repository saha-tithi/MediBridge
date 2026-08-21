from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Address
from .serializers import AddressSerializer


class AddressListCreateAPIView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = AddressSerializer

    def get_queryset(self):

        return Address.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        address = serializer.save(
            user=self.request.user
        )

        if address.is_default:

            Address.objects.filter(
                user=self.request.user
            ).exclude(
                id=address.id
            ).update(
                is_default=False
            )



class AddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = AddressSerializer

    lookup_field = "pk"

    def get_queryset(self):

        return Address.objects.filter(
            user=self.request.user
        )

    def perform_update(self, serializer):

        address = serializer.save()

        if address.is_default:

            Address.objects.filter(
                user=self.request.user
            ).exclude(
                id=address.id
            ).update(
                is_default=False
            )