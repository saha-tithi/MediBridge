from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import (CreateOrderSerializer,OrderSerializer,)
from .services import create_order,process_order, update_order_status
from .permissions import IsPharmacistOrAdmin
from .emails import send_order_placed_email,send_order_delivered_email
import razorpay
from django.conf import settings
from cart.models import Cart


class CreateOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        try:
            order = create_order(customer=request.user,shipping_address=serializer.validated_data["shipping_address"], payment_method=serializer.validated_data["payment_method"])
            if order.payment_method == Order.PaymentMethod.COD:
               send_order_placed_email(order)


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

class CreateRazorpayOrderAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        order = get_object_or_404(
            Order,
            id=pk,
            customer=request.user,
        )



        if order.payment_method != Order.PaymentMethod.ONLINE:

            return Response(
                {
                    "success": False,
                    "message": "Razorpay payment is only available for online orders.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if order.razorpay_order_id:

            return Response(
                {
                    "success": True,
                    "message": "Razorpay order already exists.",
                    "data": {
                        "razorpay_order_id":
                            order.razorpay_order_id,

                        "amount":
                            int(
                                order.total_amount * 100
                            ),

                        "currency":
                            "INR",

                        "key_id":
                            settings.RAZORPAY_KEY_ID,
                    },
                },
                status=status.HTTP_200_OK,
            )


      

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )



        amount = int(
            order.total_amount * 100
        )


        razorpay_order = client.order.create(
            {
                "amount": amount,
                "currency": "INR",
                "receipt": str(order.id),
            }
        )


        order.razorpay_order_id =razorpay_order["id"]


        order.save(
            update_fields=[
                "razorpay_order_id",
                "updated_at",
            ]
        )


        return Response(
            {
                "success": True,

                "message":
                    "Razorpay order created successfully.",

                "data": {

                    "razorpay_order_id":
                        razorpay_order["id"],

                    "amount":
                        amount,

                    "currency":
                        "INR",

                    "key_id":
                        settings.RAZORPAY_KEY_ID,

                },
            },

            status=status.HTTP_201_CREATED,
        )

class VerifyRazorpayPaymentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        order = get_object_or_404(
            Order,
            id=pk,
            customer=request.user,
        )

        

        if order.payment_method != Order.PaymentMethod.ONLINE:

            return Response(
                {
                    "success": False,
                    "message": "Payment verification is only available for online orders.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if order.payment_status == Order.PaymentStatus.PAID:

            return Response(
                {
                    "success": True,
                    "message": "Payment has already been verified.",
                    "data": OrderSerializer(order).data,
                },
                status=status.HTTP_200_OK,
            )

       

        razorpay_order_id = request.data.get(
            "razorpay_order_id"
        )

        razorpay_payment_id = request.data.get(
            "razorpay_payment_id"
        )

        razorpay_signature = request.data.get(
            "razorpay_signature"
        )

        if not all(
            [
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            ]
        ):

            return Response(
                {
                    "success": False,
                    "message": "Incomplete payment details.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

       
        if (
            razorpay_order_id !=
            order.razorpay_order_id
        ):

            return Response(
                {
                    "success": False,
                    "message": "Invalid Razorpay order.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )

        

        try:

            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id":
                        razorpay_order_id,

                    "razorpay_payment_id":
                        razorpay_payment_id,

                    "razorpay_signature":
                        razorpay_signature,
                }
            )

        except razorpay.errors.SignatureVerificationError:

            return Response(
                {
                    "success": False,
                    "message": "Payment verification failed.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
                # =========================================
        # PAYMENT VERIFIED SUCCESSFULLY
        # =========================================

        order.razorpay_payment_id = (
            razorpay_payment_id
        )

        order.razorpay_signature = (
            razorpay_signature
        )

        order.payment_status = (
            Order.PaymentStatus.PAID
        )

        order.save(
            update_fields=[
                "razorpay_payment_id",
                "razorpay_signature",
                "payment_status",
                "updated_at",
            ]
        )


        # =========================================
        # CLEAR CART AFTER SUCCESSFUL PAYMENT
        # =========================================

        try:

            cart = Cart.objects.get(
                customer=request.user
            )

            cart.items.all().delete()

        except Cart.DoesNotExist:

            pass


        # =========================================
        # SEND ORDER PLACED EMAIL
        # =========================================

        send_order_placed_email(order)


        # =========================================
        # RESPONSE
        # =========================================

        serializer = OrderSerializer(
            order
        )

        return Response(
            {
                "success": True,
                "message": "Payment verified successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
            if new_status == Order.Status.DELIVERED:
              send_order_delivered_email(order)

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


class OrderPaymentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order,id=pk,customer=request.user,)

        if order.payment_method != Order.PaymentMethod.ONLINE:
            return Response(
                {
                    "success": False,
                    "message": "Payment is not required for COD orders.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.payment_status != Order.PaymentStatus.PENDING:
            return Response(
                {
                    "success": False,
                    "message": "Payment cannot be updated for this order.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.payment_status = Order.PaymentStatus.PAID

        order.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        serializer = OrderSerializer(order)

        return Response(
            {
                "success": True,
                "message": "Payment marked as successful.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
