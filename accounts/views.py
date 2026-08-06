from rest_framework import generics,permissions
from rest_framework.response import Response
from .models import User
from .serializers import RegisterSerializer,ProfileSerializer


class RegisterView(generics.CreateAPIView):
    queryset=User.objects.all()
    serializer_class=RegisterSerializer
    permission_classes=[permissions.AllowAny]

class ProfileView(generics.RetrieveAPIView):
    serializer_class=ProfileSerializer

    def get_object(self):
        return self.request.user