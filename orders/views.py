from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import (CreateOrderSerializer,OrderSerializer,)
from .services import create_order,process_order, update_order_status
from .permissions import IsPharmacistOrAdmin


class CreateOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        try:
            order = create_order(customer=request.user,shipping_address=serializer.validated_data["shipping_address"],)

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = OrderSerializer(order)

        return Response(
            {
                "success": True,
                "message": "Order placed successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user).prefetch_related("items__medicine")

        serializer = OrderSerializer(orders,many=True,)

        return Response(
            {
                "success": True,
                "message": "Orders fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OrderDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items__medicine"),id=pk,customer=request.user,)

        serializer = OrderSerializer(order)

        return Response(
            {
                "success": True,
                "message": "Order fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

class PharmacistOrderListAPIView(APIView):
    permission_classes = [IsPharmacistOrAdmin]

    def get(self, request):
        orders = Order.objects.all().prefetch_related("items__medicine","items__prescription",)

        serializer = OrderSerializer(orders,many=True,)

        return Response(
            {
                "success": True,
                "message": "Orders fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class PharmacistOrderDetailAPIView(APIView):
    permission_classes = [IsPharmacistOrAdmin]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items__medicine","items__prescription",),id=pk,)
        serializer = OrderSerializer(order)
        return Response(
            {
                "success": True,
                "message": "Order fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

class PharmacistProcessOrderAPIView(APIView):
    permission_classes = [IsPharmacistOrAdmin]

    def post(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items__medicine","items__prescription",),id=pk,)

        try:
            order = process_order(order)

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderSerializer(order)

        return Response(
            {
                "success": True,
                "message": "Order processed and packed successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

class PharmacistUpdateOrderStatusAPIView(APIView):
    permission_classes = [IsPharmacistOrAdmin]

    def patch(self, request, pk):
        order = get_object_or_404(Order,id=pk,)

        new_status = request.data.get("status")

        allowed_statuses = [Order.Status.SHIPPED,Order.Status.DELIVERED,]

        if new_status not in allowed_statuses:
            return Response(
                {
                    "success": False,
                    "message": "Invalid status."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = update_order_status(order,new_status,)

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderSerializer(order)

        return Response(
            {
                "success": True,
                "message": "Order status updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )