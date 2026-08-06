from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Registration successful.",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
   
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = data["user"]

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "phone_number": user.phone_number,
                        "role": user.role,
                    },
                    "tokens": {
                        "access": data["access"],
                        "refresh": data["refresh"],
                    },
                },
            },
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())

        return Response(
            {
                "success": True,
                "message": "Profile fetched successfully.",
                "data": serializer.data,
            }
        )

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data": serializer.data,
            }
        )