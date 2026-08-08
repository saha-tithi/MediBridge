from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CartItem
from .serializers import (AddToCartSerializer,CartSerializer,UpdateCartItemSerializer,)
from .services import (add_to_cart,clear_cart,get_cart,remove_cart_item,update_cart_item,)


class CartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_cart(request.user)

        serializer = CartSerializer(cart)

        return Response(
            {
                "success": True,
                "message": "Cart fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AddToCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data,context={"request": request},)

        serializer.is_valid(raise_exception=True)

        try:
            cart_item = add_to_cart(
                customer=request.user,
                medicine_id=serializer.validated_data["medicine_id"],
                quantity=serializer.validated_data["quantity"],
                prescription_id=serializer.validated_data.get("prescription_id"),
            )

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = CartSerializer(cart_item.cart)

        return Response(
            {
                "success": True,
                "message": "Medicine added to cart successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class UpdateCartItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        cart_item = get_object_or_404(CartItem,id=pk,cart__customer=request.user,)

        serializer = UpdateCartItemSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        try:
            update_cart_item(cart_item=cart_item,quantity=serializer.validated_data["quantity"],)

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_serializer = CartSerializer(cart_item.cart)

        return Response(
            {
                "success": True,
                "message": "Cart item updated successfully.",
                "data": cart_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class RemoveCartItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        cart_item = get_object_or_404(CartItem,id=pk,cart__customer=request.user,)

        cart = cart_item.cart

        remove_cart_item(cart_item)

        serializer = CartSerializer(cart)

        return Response(
            {
                "success": True,
                "message": "Cart item removed successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ClearCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_cart(request.user)

        clear_cart(cart)

        serializer = CartSerializer(cart)

        return Response(
            {
                "success": True,
                "message": "Cart cleared successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )